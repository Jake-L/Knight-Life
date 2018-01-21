var socket = io();

function login()
{
	console.log("emitting username and password to server");
	document.getElementById('loginstatus').innerHTML = "";
	socket.emit('login', document.getElementById('loginusername').value, document.getElementById('loginpassword').value);
}

socket.on('loginresult', function(result, username)
{
	console.log(result, username);

	if (result == true)
	{
		document.cookie = "username=" + username;
		document.getElementById('loginstatus').innerHTML = "login successful!";
	}
	else
	{
		document.getElementById('loginstatus').innerHTML = "login failed!";
	}
});