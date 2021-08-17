const io = require('socket.io')(3000, {
  cors: {
    origin: ['http://127.0.0.1', 'http://localhost'],
  },
})
const listItem = (ctx, private = false) => `<li class="list-group-item ${private ? 'private-inset-border' : ''}">${ctx}</li>`
const talker = ({ id, Name }) => `<a href="#" class="text-info"  data-id="${id}">${Name}</a>`
const enterer = ({ id, Name }) => `<a class="text-warning" href="#" data-id="${id}">${Name}</a>`
const listener = ({ talkToId = '', talkTo = 'you' } = {}) => `<a href="#" class="text-danger"  data-id="${talkToId}">${talkTo}</a>`
const currentUser = ({ Name }) => `<a href="#" class="text-success">${Name}</a>`

const usersList = { r1: [], r2: [], r3: [] }
io.on('connection', (socket) => {
  socket.on('talking', (queryObj, cb) => {
    function message(isPrivate = false) {
      return listItem(`${talker(queryObj)} private talked to ${listener(queryObj)} : ${queryObj.message}`, isPrivate)
    }
    let privateTalk = false
    if (queryObj.privateTalk) {
      privateTalk = true
      socket.to(queryObj.talkToId).emit('listening', message(true))
    } else {
      publicMessage = message().replace('private ', '')
      if (queryObj.talkTo !== 'Everybody') {
        socket.to(queryObj.Room).except(queryObj.talkToId).emit('listening', publicMessage)
        socket.to(queryObj.talkToId).emit('listening', publicMessage.replace(queryObj.talkTo, 'you'))
      } else {
        socket.to(queryObj.Room).emit('listening', publicMessage)
      }
    }
    const talkerMessage = listItem(`You talked to ${listener(queryObj)} : ${queryObj.message}`, privateTalk)
    cb(talkerMessage)
  })

  for (const list of Object.values(usersList)) {
    list.splice(0, list.length)
  }
  io.emit('updateList', Date.now())

  socket.on('connecting', (queryObj) => {
    usersList[queryObj.Room].push(queryObj)
  })

  setTimeout(() => {
    const listStr = { r1: '', r2: '', r3: '' }
    for (const [room, users] of Object.entries(usersList)) {
      users.forEach((user) => (listStr[room] += listItem(`${talker(user)} ${user.Gender}`)))
    }
    io.emit('updateUserList', listStr)
  }, 500)

  socket.on('changeRoom', (queryObj, cb) => {
    const { Room, roomName } = queryObj
    socket.join(Room)

    socket.to(Room).emit('newUser', listItem(`User ${enterer(queryObj)} join the Room ${roomName}.`))

    cb(listItem(`Welcome ${currentUser(queryObj)} to Room ${roomName}.`))
  })
})
