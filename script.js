function diplayMessage(message) {
  chatbox.insertAdjacentHTML('beforeend', message)
}
function displayUserList(list) {
  userList.innerHTML = list
}
let socket = null
const queryObj = {}

if (location.search) {
  userForm.classList.add('d-none')
  chatRoom.classList.remove('d-none')
  socket = io('http://127.0.0.1:3000')

  Object.assign(queryObj, Object.fromEntries(new URL(location).searchParams.entries()))
  rooms.value = queryObj.Room

  Object.assign(queryObj, {
    roomName: rooms.options[rooms.selectedIndex].text,
    privateTalk: false,
    talkTo: users.options[users.selectedIndex].text,
    talkToId: '',
  })

  socket.on('connect', () => {
    queryObj.id = socket.id
    socket.emit('changeRoom', queryObj, (message) => diplayMessage(message))
  })

  socket.on('listening', (message) => diplayMessage(message))

  socket.on('newUser', (message) => diplayMessage(message))

  socket.on('updateList', (now) => {
    socket.emit('connecting', queryObj)
  })

  socket.on('updateUserList', (list) => {
    displayUserList(list[queryObj.Room])
  })

  chatbox.addEventListener('click', ({ target: { dataset: data, text } }) => {
    event.preventDefault()
    const isRepeatUsersOption = [...users.options].some((o) => o.text === text)
    if (!data.id) return
    if (!isRepeatUsersOption) {
      const usersOption = document.createElement('option')
      usersOption.value = data.id
      usersOption.text = text
      users.appendChild(usersOption)
    }
    users.value = data.id
    users.dispatchEvent(new Event('change'))
    Object.assign(queryObj, {
      talkTo: text,
      talkToId: data.id,
    })
  })

  send.addEventListener('click', () => {
    if (!textbox.value) return
    Object.assign(queryObj, {
      message: textbox.value,
    })

    socket.emit('talking', queryObj, (message) => diplayMessage(message))
    textbox.value = ''
  })

  rooms.addEventListener('change', (e) => {
    Object.assign(queryObj, { roomName: rooms.options[rooms.selectedIndex].text, Room: rooms.value })
    chatbox.innerHTML = ''
    users.innerHTML = '<option value="" selected>Everybody</option>'
    socket.emit('changeRoom', queryObj, (message) => diplayMessage(message))
  })
  privateTalkCheck.addEventListener('change', () => {
    Object.assign(queryObj, {
      privateTalk: privateTalkCheck.checked,
    })
  })
  users.addEventListener('change', (e) => {
    privateTalkCheck.disabled = !users.value
    privateTalkCheck.checked = users.value || false

    Object.assign(queryObj, {
      privateTalk: users.value || false,
      talkTo: users.options[users.selectedIndex].text,
      talkToId: users.value,
    })
  })
}
