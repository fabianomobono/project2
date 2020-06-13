import os
import requests
from flask import Flask, render_template, redirect, request, jsonify, flash
from flask_socketio import SocketIO, emit


# app parameters
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# set global variables
display_name = []
chatrooms = {"main": []}
chatroom_names = []
message_id = 0


# main page
@app.route("/")
def index():
    messages = chatrooms['main']
    print(messages)
    return render_template("index.html", chatrooms=chatroom_names, names=display_name)


# make sure username does not exist yet
@app.route("/check_username", methods=["POST"])
def check():
    username = request.values['username']

    # check if username has already been used
    if username in display_name:
        return 'user is taken'

    display_name.append(username)
    print(username)
    print(display_name)
    return username


# add users to user list
@app.route('/add_user', methods=['POST'])
def add_user():
    user = request.values['user']
    if user not in display_name:
        display_name.append(user)
    print('42')
    return 'ok'


# listen and bradcast messages
@socketio.on("broadcast message")
def send_message(data):
    print('socket iooooooooo')
    print(data)
    message = data["message"]
    time = data["time"]
    date = data["date"]
    user = data["user"]
    chatroom = data['chatroom']
    list_index = len(chatrooms[f'{chatroom}'])
    print(chatroom)
    global message_id
    # make sure list doesn't have more then 100 messages
    if len(chatrooms[f'{chatroom}']) == 100:
        chatrooms[f'{chatroom}'].pop(0)

    # add message to list of massages
    chatrooms[f'{chatroom}'].append({"message": message, "date": date, "time": time, "user": user,
                                     "message_id": message_id, "list_index": list_index, "chatroom": chatroom})
    print(chatrooms)

    # increment message id
    message_id += 1

    # broadcast message to everyone
    emit("announce message", {"message": message, "date": date, "time": time, "user": user,
                              "message_id": message_id, "list_index": list_index, "chatroom": chatroom}, broadcast=True)


# listen and broadcast new Chatrooms
@socketio.on("new_chatroom")
def new_chatroom(chatroom):
    print('socket new chatroom')
    chatroom_name = chatroom['name']
    chatrooms[f'{chatroom_name}'] = []
    chatroom_names.append(chatroom_name)
    print(chatrooms)
    emit('announce chatroom', {"name": chatroom_name}, broadcast=True)


# update users
@socketio.on('online users')
def update_users(user):
    user = user['user']
    print('line 87')
    print('Line 88 this is the socket finction ')
    print(user)
    emit('update users', {'user': user}, broadcast=True)


# load chatroom message
@app.route("/load_chatroom_messages", methods=["POST"])
def load_chatroom():
    chatroom = request.values['chatroom']
    try:
        messages = chatrooms[f'{chatroom}']
        return jsonify(messages)

    except:

        return 'not found'


# delete messages function
@app.route("/delete_message", methods=["POST"])
def delete_message():
    list_index = int(request.values['x'])
    chatroom = request.values['chatroom']
    print(list_index)
    print(chatroom)
    x = 0
    for i in chatrooms[f'{chatroom}']:
        if chatrooms[f'{chatroom}'][x]['list_index'] == list_index:
            del chatrooms[f'{chatroom}'][x]
        x += 1

    return "working on it"
