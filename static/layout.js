

// load messages function
function load_messages(data){
  console.log(data)
  for (var i = 0; i < data.length; i++){
    document.querySelector("#loaded_messages").insertAdjacentHTML("beforeend",
     "<div class='full_message'><p class='date'>" + data[i]["date"] + "</p><br><p class='sender-user'>"
     + data[i]["user"] + ":</p><br><div class='sent-text'>"
     + data[i]["message"] + "</div>" + "<div class='time'>" + data[i]['time'] +
     "</div><br><span class='x'><p onclick='delete_message(this, this.id)' class='delete_message' id='"
     + data[i]["list_index"] + "'></p></span><br><hr></div>")

     if(localStorage.getItem('username') == data[i]['user']){
       document.getElementById(data[i]["list_index"]).innerHTML = 'x';
     }
  }
}

//function to delete messages
function delete_message(x, y){
  // fade and shrink animation
  x.parentNode.parentNode.style.animationName = 'hide'
  x.parentNode.parentNode.style.animationPlayState = 'running';

  // when the animation is done
  x.parentNode.parentNode.addEventListener('animationend', () => {
    request.open("POST", "/delete_message?x=" + id + "&chatroom=" + localStorage.getItem("chatroom"), true)
    x.parentNode.parentNode.remove()

    // send request
    request.send()
  })
  id = y

  // initialize new request
  var request = new XMLHttpRequest()
}

//stuff to do when loading the page
document.addEventListener("DOMContentLoaded", () => {
var socket3 = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
socket3.on("connect", () => {
  // check if username is stored in localStorage, if not prompt for a username
  if(!localStorage.getItem("username")){
    var username
    while (username == '' || username == null){
      username = window.prompt("Type in a username")
    }

    const request = new XMLHttpRequest();
    request.open("POST", "/check_username?username=" + username, true)

    // what happens when the request loads
    request.onload = () => {

    // if user is taken
      if (request.responseText == 'user is taken'){
        alert("user is taken")
        location.reload();
      }

      else{

        // put the user name in 'currently logged in as...'
        localStorage.setItem("username", username)
        const response = request.responseText
        document.querySelector("#username").innerHTML = username
        console.log('71')

        //breadcast user to everyone
        socket3.emit('online users', {'user': username})
        }

      }

    request.send()
  }

  else{
  document.querySelector("#username").innerHTML = localStorage.getItem("username")
  var request = new XMLHttpRequest();
  request.open("POST", "/add_user?user=" + localStorage.getItem("username"), true )
  request.send()
  }


  //check which chatroom was used last
  if(!localStorage.getItem('chatroom')){
    localStorage.setItem('chatroom', 'main')
    document.title = "Flack" + " | " + localStorage.getItem("chatroom")
    document.querySelector("#insert_chatroom").append(localStorage.getItem("chatroom"))

  }

  else{
    var chatroom = localStorage.getItem("chatroom");
    const request = new XMLHttpRequest();
    request.open("POST", "/load_chatroom_messages?chatroom=" + chatroom, true)

    //what happens when the requeset comse back
    request.onload = () => {

        // if the chatroom name doesn't exist anymore becaue the server was shut down and the old localStorage
        // chatroom doesn't exist on the server anymore
        if(request.responseText == 'not found'){

          // change the chatroom to main and open a new request
          localStorage.setItem("chatroom", 'main')
          chatroom = localStorage.getItem('chatroom')
          const request2 = new XMLHttpRequest();
          request2.open("POST", "/load_chatroom_messages?chatroom=" + localStorage.getItem('chatroom'), true)

          request2.onload = () => {
            messages = JSON.parse(request2.responseText)
            document.title = "Flack" + ' | '  + chatroom
            document.querySelector("#insert_chatroom").innerHTML = ''
            document.querySelector("#insert_chatroom").append(chatroom)
            document.querySelector("#loaded_messages").innerHTML = ''
            load_messages(messages)

          }
          request2.send()
        }

        else {
          messages = JSON.parse(request.responseText)
          document.title = "Flack" + ' | '  + chatroom
          document.querySelector("#insert_chatroom").innerHTML = ''
          document.querySelector("#insert_chatroom").append(chatroom)
          document.querySelector("#loaded_messages").innerHTML = ''
          load_messages(messages)


        }
    }
    request.send()
  }


  // scroll to the end of the consersation
  document.querySelector(".new-messages").scrollTo(0, document.querySelector(".new-messages").scrollHeight);

  //logout link
  document.querySelector("#log_out").addEventListener('click', e => {
    e.preventDefault()
    localStorage.removeItem('username')
    location.reload()
  })
socket3.on('update users', user => {
  var element = document.createElement('li')
  element.innerHTML = user['user']
  document.querySelector(".currently_online").append(element)
})
})
})

//when you click on a chatroom....change page title and h1 chatroom title... and load chatroom messages!!!!!YAY
function chatroom(event){
  var name = event.target.innerHTML
  document.querySelector("#insert_chatroom"). innerHTML = ''
  document.querySelector("#insert_chatroom").append(name)
  document.title = 'Flack' + " | " + name
  localStorage.setItem('chatroom', name)

  //load messages from chatroom
  var request = new XMLHttpRequest();
  var current_chatroom = localStorage.getItem('chatroom')
  request.open("POST", "/load_chatroom_messages?chatroom=" + current_chatroom, true)

  request.onload = () => {
    const data = JSON.parse(request.responseText)

    document.querySelector("#loaded_messages").innerHTML = '';
    load_messages(data)
  }
  request.send()
}

//socket message logic to send message
var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
socket.on('connect', () => {

// code send button
document.querySelector("#text-message").addEventListener("keydown", function(event){

  // set variables regarding message
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  user = localStorage.getItem('username')
  var today = new Date()
  var time = today.getHours() + ":" + today.getMinutes()
  var date = weekdays[today.getDay()] + "  " + (today.getMonth() + 1)  + "/" + today.getDate()

  // if enter key is pressed
  if (event.keyCode === 13){
    var message = document.querySelector("#text-message").value.trim();

    // if message is empty
    if (event.keyCode === 13 && message.length < 1){
      event.preventDefault()
      document.querySelector("#text-message").value = '';
    }

    //if message exists
    if (message.length > 0) {

      // prevent enter from writing new line
      event.preventDefault()
      console.log(user)
      // send the message to server wich will broadcast it to everyone
      socket.emit('broadcast message', {'message': message, 'time': time, "date": date, 'user': user, 'chatroom': localStorage.getItem('chatroom')})

      //delete old message from textbox
      document.querySelector("#text-message").value = ''
    }
  }
})

// when it comes back
socket.on('announce message', data => {
  current_chatroom = localStorage.getItem('chatroom')
  console.log(current_chatroom)
  console.log(data["chatroom"])

  if (current_chatroom == data["chatroom"]){
    document.querySelector("#loaded_messages").insertAdjacentHTML("beforeend",
    "<div class='full_message'><p class='date'>" + data["date"] + "</p><br><p class='sender-user'>"
    + data["user"] + ":</p><br><div class='sent-text'>"
    + data["message"] + "</div>" + "<div class='time'>" + data['time'] +
    "</div><br><span class='x'><p onclick='delete_message(this, this.id)' class='just-sent' id='"
    + data['list_index'] + "'></p></span><br><hr></div>")

    console.log(data['user'])
     if (localStorage.getItem('username') == data['user']){
       var all = document.querySelectorAll(".just-sent")
       var last = all[all.length -1]
       last.innerHTML = 'x'
     }
    // scroll to the end of the consersation
    document.querySelector(".new-messages").scrollTo(0, document.querySelector(".new-messages").scrollHeight);
  }

})
})

// broadcast chatrooms to everyone
var socket2 = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
socket2.on('connect', () => {
  //popup logic
  document.querySelector(".new_chatroom").addEventListener("click", event => {

    event.preventDefault();
    // show pop up window
    document.querySelector("#popup-window-new-chatroom").style.display = 'block';

    // disable message box
    document.querySelector("#text-message").disabled = true;

    // change backgroun this still needs work
    document.querySelector("body").style.backgroundColor = 'rgba(0,0,0,0.4)'

    // focus on input
    document.querySelector("#chatroom-name").focus();

  })

  // cancel popup
  document.querySelector("#cancel-popup").addEventListener('click', event => {
    event.preventDefault()
    //hide popup
    document.querySelector("#popup-window-new-chatroom").style.display = 'none';

    // enable message box
    document.querySelector("#text-message").disabled = false;


    //body background-color = white
    document.querySelector("body").style.backgroundColor = 'white';
    document.querySelector("#chatroom-name").value = ''
    console.log("canceled")

  })

  // actually create a chatroom
  document.querySelector(".create-chatroom").addEventListener('submit', event => {
    event.preventDefault();
    var element = document.createElement('li')
    var chatroom = document.querySelector("#chatroom-name").value

    // check input
    if (chatroom.length < 2){
      document.querySelector("#chatroom-name").value = ''
      alert("Invalid chatroom name too short")
      return false;
    }

    // check if chatroom name already exists
    current_names = []
    document.querySelectorAll(".current-chatroom-names").forEach( li => {
      current_names.push(li.innerHTML)
    })
    console.log(current_names)
    console.log(chatroom)

    //check if chatroom exists
    if(current_names.length > 0 && current_names.includes(chatroom) == true){
      alert("name taken")
      return false
    }


    element.innerHTML = chatroom
    element.setAttribute('class', 'current-chatroom-names')
    socket2.emit("new_chatroom", {"name": chatroom})

    //hide popup
    document.querySelector("#popup-window-new-chatroom").style.display = 'none';

    // enable message box
    document.querySelector("#text-message").disabled = false;


    //body background-color = white
    document.querySelector("body").style.backgroundColor = 'white';
    document.querySelector("#chatroom-name").value = ''
  })
})

// broadcasting a newly created chatroom
socket2.on("announce chatroom", chatroom => {
  var li = document.createElement("li")
  li.setAttribute('class', 'current-chatroom-names')
  li.innerHTML = chatroom["name"]
  document.querySelector(".current-chatrooms").append(li)
})
