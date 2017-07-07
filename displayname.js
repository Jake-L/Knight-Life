var username;
var c = decodeURIComponent(document.cookie).split(';');
	
// read username from a cookie
if (c != null && c[0].substr(0,8) == "username" && c[0].length > 9)
{
	username = c[0].substr(9,c[0].length - 1);
	document.body.innerHTML = "Hello " + username + "! " + document.body.innerHTML;
}

document.body.innerHTML = "<p>" + document.body.innerHTML + "</p>";
console.log(document.body.innerHTML);

