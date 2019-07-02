var socket = io();

function login()
{
	var username = document.getElementById('loginusername').value.trim();
	var password = document.getElementById('loginpassword').value.trim();

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
		var date = new Date();
		date.setTime(date.getTime()+(2*24*60*60*1000)); // cookie lasts for 2 days
		document.cookie = "username=" + username + "; expires="+date.toGMTString();
		document.getElementById('loginstatus').innerHTML = "login successful!";
		// hide the form
		document.getElementById('loginform').classList.toggle('fade');
		setTimeout(function(){
			// reset the form
			document.getElementById('loginform').style.display = 'none';
			document.getElementById('loginform').classList.toggle('fade');
			document.getElementById('loginstatus').innerHTML = "";
			document.getElementById('loginpassword').value = "";
		}, 1000);
	}
	else
	{
		document.getElementById('loginstatus').innerHTML = "login failed!";
	}
});

function register()
{
	var username = document.getElementById('registrationusername').value.trim();
	var password = document.getElementById('registrationpassword').value.trim();

	if (username == null || username == "")
	{
		document.getElementById('registrationstatus').innerHTML = "Please enter a username";
	}
	else if (password == null || password == "")
	{
		document.getElementById('registrationstatus').innerHTML = "Please enter a password";
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
		// hide the form
		document.getElementById('registrationform').classList.toggle('fade');
		setTimeout(function(){
			// reset the form
			document.getElementById('registrationform').style.display = 'none';
			document.getElementById('registrationform').classList.toggle('fade');
			document.getElementById('registrationstatus').innerHTML = "";
			document.getElementById('registrationpassword').value = "";
		}, 1000);
	}
	else
	{
		document.getElementById('registrationstatus').innerHTML = "registration failed!";
	}
});