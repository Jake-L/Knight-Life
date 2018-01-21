var socket = io();

function login()
{
	var username = document.getElementById('loginusername').value;
	var password = document.getElementById('loginpassword').value;

	if (username == null || username == "")
	{
		document.getElementById('loginstatus').innerHTML = "Please enter a username";
	}
	else if (password == null || password == "")
	{
		document.getElementById('loginstatus').innerHTML = "Please enter a password";
	}
	else
	{
		document.getElementById('loginstatus').innerHTML = "";
		socket.emit('login', username, password);
	}
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

function register()
{
	var username = document.getElementById('registrationusername').value;
	var password = document.getElementById('registrationpassword').value;

	if (username == null || username == "")
	{
		document.getElementById('loginstatus').innerHTML = "Please enter a username";
	}
	else if (password == null || password == "")
	{
		document.getElementById('loginstatus').innerHTML = "Please enter a password";
	}
	else
	{
		document.getElementById('registrationstatus').innerHTML = "";
		socket.emit('register', username, password);
	}
}

socket.on('registrationresult', function(result, username)
{
	if (result == true)
	{
		document.cookie = "username=" + username;
		document.getElementById('registrationstatus').innerHTML = "registration successful!";
	}
	else
	{
		document.getElementById('registrationstatus').innerHTML = "registration failed!";
	}
});