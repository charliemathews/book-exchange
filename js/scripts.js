const DEBUG = true ;

const GOOGLE_API_KEY = "AIzaSyAlrIyWurhDloHNIKeNcbtdjQEZ3Q97ShM" ;

const VIEW_HOME 			= "home" ;
const VIEW_LOGIN 			= "login" ;
const VIEW_SEARCH			= "search" ;
const VIEW_LIST	 		= "list_view" ;
const VIEW_CONTACT	 		= "buy_view" ;
const VIEW_SELL 			= "sell" ;
const VIEW_SELL_SENT		= "sell_sent" ;
const VIEW_MY_BOOKS 		= "my_books" ;
const VIEW_FAQ				= "faq" ;
const VIEW_CONTACTED		= "contacted_view" ;
const VIEW_SUBMITTED		= "submitted_view" ;

const DELETE_POWER = 2 ;

var selectedView = VIEW_HOME; 
var colorbrew = null ;

var loggedIn = false ;
var user = "" ;
var waitingForKey = false ;

var selectedBookID = null ;

/*
** Dynamically resize based on width of div to maintain a perfect square.
*/
function buySellResize()
{
	var cw = $('.side').width();
	$('.side').css({
		'height': cw + 'px', 		// dynamic resize squares
		'line-height': cw + 'px' 	// dynamic "vertical-align: middle"
	});
}

/*
** FX for displaying backdrop.
*/
function enableBackdrop()
{
	$("#backdrop").finish().animate({opacity: 1}, 600);
	$("#title").finish().animate({color: "#FFFFFF"}, 600);
	$("#tag").finish().animate({color: "#FFFFFF"}, 400);
}

/*
** FX for removing backdrop.
*/
function disableBackdrop()
{
	$("#backdrop").finish().animate({opacity: 0}, 600);
	$("#title").finish().animate({color: "#CED4D9"}, 600);
	$("#tag").finish().animate({color: "#2E2E2E"}, 900);
}

/*
** Generate new triangle palettes.
** URL: http://qrohlf.com/trianglify/
*/
function backdropFX()
{
	if(colorbrew == null)
	{
		disableBackdrop();
		return ;
	}

	var pattern = Trianglify({
        width: $("#backdrop").innerWidth(),
        height: $("#backdrop").innerHeight(),
        x_colors: colorbrew,
        y_colors: colorbrew
    });
    $("#backdrop").html(pattern.canvas());
}

/*
** Set color and generate backdrop.
*/
function setBackdrop(input)
{
	if(input == "blue") 		colorbrew = "Blues";
	else if(input == "red") 	colorbrew = "Reds";
	else 						colorbrew = null ;
	
	backdropFX();
}

/*
** Hide all sections. Show selected.
*/
function showSection(selection) // switch this to an array of sections
{
	// hide all
	$("section").css({"display":"none"});

	// show selection
	selectedView = selection ;
	$("#"+selection).css({"display":"block"});

	// exceptions
	if(selection == VIEW_HOME || selectedView == VIEW_LOGIN || selectedView == VIEW_MY_BOOKS) 
	{
		setBackdrop();
		buySellResize();
	}
}

/*
$('#form_sell').isHappy({
    fields: {
      '#isbn': {
        required: false,
        message: 'What is your book\'s ISBN number?'
      },
			'#title': {
        required: true,
        message: 'What is your book\'s title?'
      },
			'#author': {
        required: true,
        message: 'Who is your book\'s author?'
      }
    }
  });
	*/

/*
** GENERIC AJAX REQUEST
*/
function ajax_request(form, inputs)
{
	var dataString = JSON.stringify(inputs);
	if(DEBUG) console.log(dataString);

	$.ajax({
		type: "POST",
		url: "http://www.randyconnolly.com/tests/process.php",
		data: dataString,
		success: function() { }
	});

	// TODO: RETURN AJAX RESPONSE HERE
	return "response string";
}

/*
** Check to see if the user is logged in on the server.
*/
function checkLogin()
{
	/*
	$.getJSON('exchange.php', {}, function(data)
	{
		loggedIn = data.loggedin ;
		if(loggedIn === true) user = data.user ;
	});
	*/
	
	$.ajax({
		url: 'exchange.php',
		dataType: 'json',
		async: false,
		success: function(data)
		{
			loggedIn = data.loggedin ;
			if(loggedIn === true) user = data.user ;
		}
	});
	
	if(loggedIn === true)
	{
		$('#users_name').text(user);
		$('.loggedin').css("opacity","1");
		$('footer').css("opacity","1");
		return true ;
	}
	else 
	{
		showSection(VIEW_LOGIN);
		user = "" ;
		$('.loggedin').css("opacity","0");
		$('footer').css("opacity","0");
		return false ;
	}
}

/*
** Logout the user.
*/
function logout()
{
	//$.getJSON('exchange.php', { request: 'logout' });
	$.ajax({
		url: 'exchange.php',
		dataType: 'json',
		async: false,
		data:{ request: 'logout' },
		success: function(data)
		{
		}
	});
	checkLogin();
	$("#form_login").find("label").text("psst! your username is the first part of your gcc.edu email.");
	$('#form_login').find(".query").attr("value", "Please enter your GCC username.");
}

/*
** Login process.
*/
$("#form_login").submit(function(e)
{
	e.preventDefault();
	if(checkLogin() === true)
	{
		showSection(VIEW_HOME);
		return false ;
	}
	
	if(waitingForKey)
	{
		var query = $(this).find('.query').val();
	
		if(query.length != 5)
		{
			$(this).find('.query').css("border", "1px solid red") ;
			return false ;
		}
		$(this).find('.query').css("border", "1px solid lightgreen") ;

		$.getJSON('exchange.php', { key: query }, function(data)
		{
			//console.log(data);
			if(data.loggedin === false) $("#form_login").find('.query').css("border", "1px solid red") ;
			else 
			{
				waitingForKey = false ;
				$("#form_login").find("label").text("Success!");
				checkLogin();
				$("#form_login").find(".query").attr("value", "").val("");
				$("#form_login").find('.query').css("border", "1px solid grey") ;
				showSection(VIEW_HOME);
			}
		});
		return true ;
	}
	
	var query = $(this).find('.query').val();
	
	if(query.indexOf("@") > -1 || query.indexOf("gcc") > -1 || query.indexOf("GCC") > -1)
	{
		$(this).find('.query').css("border", "1px solid red") ;
		return false ;
	}
	$(this).find('.query').css("border", "1px solid lightgreen") ;
	
	$.getJSON('exchange.php', { user: query }, function(data)
	{
		//console.log(data);
		if('error' in data) $(this).find('.query').css("border", "1px solid red") ;
		else 
		{
			waitingForKey = true ;
			$('#form_login').find(".query").attr("value", "").val("");
			$("#form_login").find("label").text(data.logs[0]);
		}
	});
	return true;
});

/*
** Output / refresh search results.
*/
function getSearchResults()
{
	var query = $('#form_search').find('.query').val();
	if(query == "search by ISBN, title, or author") query = "" ;
	$.getJSON('exchange.php', { request: 'search', query: query }, function(data)
	{
		console.log(data);
		$(".search_results").empty();
		var results = data.results ;
		
		var i;
		var output = "<table id=\"results_table\"><thead><tr><td>Title</td><td>Author</td><td>Ed.</td><td>ISBN</td><td>Condition</td><td>Price</td>";
		if(data.power >= DELETE_POWER) output = output + "<td>Delete</td>" ;
		output = output + "</tr></thead><tbody>" ;
		for(i = 0; i < results.length; i++)
		{
			if(results[i].author == null) results[i].author = "-" ;
			if(results[i].edition == null) results[i].edition = "-" ;
			if(results[i].isbn == null) results[i].isbn = "-" ;
			if(results[i].condition == null) results[i].condition = "-" ;
			
			output = output + "<tr class=\"entry\" alt=" + results[i].id + ">" +
						"<td class=\"buy\">" + results[i].title + 
			    			"</td><td class=\"buy\">" + results[i].author + 
			    			"</td><td class=\"buy\">" + results[i].edition + 
			    			"</td><td class=\"buy\">" + results[i].isbn + 
			    			"</td><td class=\"buy\">" + results[i].condition +
						"</td><td class=\"buy\">$" + results[i].price.toFixed(2); ;
			if(data.power >= DELETE_POWER) output = output + "</td><td>" + "<div class=\"delete_button\">Delete</div>" ;
			output = output + "</td></tr>" ;
		}
		output = output + "</tbody></table>" ;
		$(".search_results").append(output);
	});
}

/*
** Process book search form and output list view.
*/
$("#form_search").submit(function(e)
{
	e.preventDefault();
	checkLogin();

	getSearchResults();
	
	//showSection(VIEW_LIST);

	return false;
});

/*
** Output user's own books.
*/
function getMyBooks()
{
	$.getJSON('exchange.php', { request: 'mybooks' }, function(data)
	{
		$(".mybooks_results").empty();
		var results = data.results ;
		
		var i;
		var output = "<h3 class=\"my_book_listings\">Your Live Listings</h3><table id=\"results_table\"><thead><tr><td>Title</td><td>Author</td><td>Ed.</td><td>ISBN</td><td>Condition</td><td>Price</td><td>Actions</td></tr></thead><tbody>" ;
		for(i = 0; i < results.length; i++)
		{
			if(results[i].author == null) results[i].author = "-" ;
			if(results[i].edition == null) results[i].edition = "-" ;
			if(results[i].isbn == null) results[i].isbn = "-" ;
			if(results[i].condition == null) results[i].condition = "-" ;
			if(results[i].isSold == 0)
			{
			output = output + "<tr class=\"entry\" alt=" + results[i].id + "><td>" + results[i].title + 
			    			"</td><td>" + results[i].author + 
			    			"</td><td>" + results[i].edition + 
			    			"</td><td>" + results[i].isbn + 
			    			"</td><td>" + results[i].condition + 
						"</td><td>$" + results[i].price.toFixed(2) + 
						"</td><td><div class=\"switch_sold\" alt=\"" + results[i].id + "\">Mark Sold</div>" +
			    			"</td></tr>" ;
			}
		}
		output = output + "</tbody></table>" ;
		
		output = output + "<h3 class=\"my_book_listings\">Your Sold Books</h3><table id=\"results_table\"><thead><tr><td>Title</td><td>Author</td><td>Ed.</td><td>ISBN</td><td>Condition</td><td>Actions</td></tr></thead><tbody>" ;
		for(i = 0; i < results.length; i++)
		{
			if(results[i].author == null) results[i].author = "-" ;
			if(results[i].edition == null) results[i].edition = "-" ;
			if(results[i].isbn == null) results[i].isbn = "-" ;
			if(results[i].condition == null) results[i].condition = "-" ;
			if(results[i].isSold == 1)
			{
			output = output + "<tr class=\"entry\" alt=" + results[i].id + "><td>" + results[i].title + 
			    			"</td><td>" + results[i].author + 
			    			"</td><td>" + results[i].edition + 
			    			"</td><td>" + results[i].isbn + 
			    			"</td><td>" + results[i].condition + 
						"</td><td><div class=\"switch_sold\" alt=\"" + results[i].id + "\">Mark Unsold</div>" +
			    			"</td></tr>" ;
			}
		}
		output = output + "</tbody></table>" ;
		
		$(".mybooks_results").append(output);
	});
}

/*
** Mark entry(id) as sold or unsold
*/
function switchSold(id)
{
	/*
	$.getJSON('exchange.php', { request: 'switchSold', query: id }, function(data)
	{
		console.log(data);
	});
	*/
	$.ajax({
		url: 'exchange.php',
		dataType: 'json',
		async: false,
		data: { request: 'switchSold', query: id },
		success: function(data)
		{
			//console.log(data);
		}
	});
}

/*
** Remove entry from server.
*/
function deleteEntry(id)
{
	/*
	$.getJSON('exchange.php', { request: 'switchSold', query: id }, function(data)
	{
		console.log(data);
	});
	*/
	console.log(id);
	$.ajax({
		url: 'exchange.php',
		dataType: 'json',
		async: false,
		data: { request: 'delete', query: id },
		success: function(data)
		{
			console.log(data);
		}
	});
	
	getSearchResults();
}

/*
** Autofill seller's form based on ISBN.
*/
function updateSell()
{
	// example
	// https://www.googleapis.com/books/v1/volumes?q=isbn:0538478152
	var isbn = $("input#isbn").val();
	if(isbn.length != 10 && isbn.length != 13) return false ;
	var key = "AIzaSyAlrIyWurhDloHNIKeNcbtdjQEZ3Q97ShM" ;
	$.getJSON('https://www.googleapis.com/books/v1/volumes', { q: 'isbn:'+isbn, key: GOOGLE_API_KEY }, function(data)
	{
		console.log("GET googleapi/books (" + isbn + ") and got " + data.totalItems + " items.");
		// console.log(data.items[0].volumeInfo.title);
		if(data.totalItems > 0)
		{
			$("input#book_title").val(data.items[0].volumeInfo.title) ;
			$("input#author").val(data.items[0].volumeInfo.authors[0]) ;
		}
	});
}

function populateContact(id)
{
	//clear everything
	//$(".single_result .book_cover").attr("src","") ;
	$('.single_result').empty();
	
	$.ajax({
		url: 'exchange.php',
		dataType: 'json',
		async: false,
		data: { request: 'single', query: id },
		success: function(data)
		{
			var isbn = data.results.isbn ;
			if(isbn.length == 10 || isbn.length == 13)
			{
				// we have an isbn
				$.ajax({
					url: 'https://www.googleapis.com/books/v1/volumes',
					dataType: 'json',
					async: false,
					data: { q: 'isbn:'+isbn, key: GOOGLE_API_KEY },
					success: function(data)
					{
						if(data.totalItems > 0)
						{
							var img = data.items[0].volumeInfo.imageLinks.thumbnail ;
							//$(".single_result .book_cover").attr("src",data.items[0].volumeInfo.imageLinks.thumbnail) ;
							$('.single_result').append("<img class=\"book_cover\" src=\"" + img + "\"/>");
						}
						else
						{
							console.log("couldn't find good match via google's api");
							var img = "book.png";
							$('.single_result').append("<img class=\"book_cover\" src=\"" + img + "\"/>");
						}
					}
				});
			}
			else
			{
				console.log("bad or no isbn while trying to populate");
				var img = "book.png";
				$('.single_result').append("<img class=\"book_cover\" src=\"" + img + "\"/>");
			}
			
			var results = data.results ;
			$('.single_result').append("<div class=\"meta\">" + results.title + "</div>");
			$('.single_result').append("<div class=\"meta\">by " + results.author + "</div>");
			if(results.edition != null) $('.single_result').append("<div class=\"meta\">Edition: " + results.edition + "</div>");
			$('.single_result').append("<div class=\"meta\">ISBN: " + results.isbn + "</div>");
			$('.single_result').append("<div class=\"meta\">Condition: " + results.condition + "</div>");
			$('.single_result').append("<div class=\"meta\">Price: $" + results.price.toFixed(2) + "</div>");
			$('.single_result').append("<div class=\"clear\"></div>");
			/*
			results[i].title + 
			    			"</td><td>" + results[i].author + 
			    			"</td><td>" + results[i].edition + 
			    			"</td><td>" + results[i].isbn + 
			    			"</td><td>" + results[i].condition + 
			*/
			selectedBookID = results.id ;
		}
	});
}

/*
** Process book submission form and output list view.
*/
$("#form_contact").submit(function(e)
{
	e.preventDefault();
	if(selectedBookID == null) return false ;
	var method = $('#delivery').val();
	var note = $( "#note_to_seller option:selected" ).text();
	$.getJSON('exchange.php', { request: 'sell', query: selectedBookID, method: method, note: note }, function(data)
	{
		console.log(data);
	});
	
	showSection(VIEW_CONTACTED);
	
	selectedBookID = null ;
	return false;
});

/*
** Process book submission.
*/
$("#form_sell").submit(function(e)
{
	e.preventDefault();
	
	var isbn = $('#isbn').val();
	var title = $('#book_title').val();
	var author = $('#author').val();
	var ed = $('#edition').val();
	var price = $('#price').val();
	var cond = $( "#condition option:selected" ).text();
	
	console.log(ed);

	$.getJSON('exchange.php', { request: 'insert', isbn: isbn, title: title, author: author, ed: ed, cond: cond, price: price}, function(data)
	{
		console.log(data);
	});
	
	$('#isbn').val("");
	$('#book_title').val("");
	$('#author').val("");
	$('#edition').val("");
	$('#price').val("");
	
	showSection(VIEW_SUBMITTED);

	return false;
});

$(document).ready(function()
{
	$("#form_login").find("label").text("psst! your username is the first part of your gcc.edu email.");
	if(checkLogin()) showSection(VIEW_HOME);
	
	// effects of hovering over any buysell .side
	$( ".side" ).hover(
		function() {
			enableBackdrop();
		}, function() {
			// maintain background if we switch viewsww
			if(selectedView == VIEW_HOME)
			{
			disableBackdrop();
			}
		}
	);

	// generate geometric backgrounds for buy and sell buttons
	$(".left").hover(function() {setBackdrop("blue");}, function(){});
	$(".right").hover(function() {setBackdrop("red");}, function(){});

	$('.back').click(function() {
		showSection(VIEW_HOME);
	});
	$('.back_search').click(function() {
		showSection(VIEW_SEARCH);
	});
	$('.back_books').click(function() {
		showSection(VIEW_HOME);
	});
	$(".left").click(function() {
		showSection(VIEW_SEARCH);
		$(".search_results").empty();
	});
	$(".right").click(function() {
		showSection(VIEW_SELL);
	});
	$('#logout').click(function() {
		logout();
		showSection(VIEW_LOGIN);
	});
	$('#account').click(function() {
		getMyBooks();
		showSection(VIEW_MY_BOOKS);
	});
	//$( ".search_results" ).on( 'click', 'table tbody tr', function( event )
	$(document).on('click', '.buy', function(e) 
	{
		var id = $(this).parent().attr("alt");
		showSection(VIEW_CONTACT);
		populateContact(id);
	});
	$(document).on('click', '.switch_sold', function(e) { 
		switchSold($(this).attr("alt"));
		getMyBooks();
	});
	$(document).on('click', '.delete_button', function(e) { 
		var id = $(this).parent().parent().attr("alt");
		deleteEntry(id);
	});
	$('#go_home').click(function() {
		showSection(VIEW_HOME);
	});
	$('#go_faq').click(function() {
		showSection(VIEW_FAQ);
	});
	
	// on focus effects for form fields
	$("#form_search").find('.query').focus(function() { 
		if($(this).val() == $(this).attr("value")) $(this).val(""); 
		$("#form_search label").finish().animate({opacity: 1}, 400);
	});
	$("#form_search").find('.query').blur(function() { 
		if(!$(this).val()) $(this).val($(this).attr("value"));
		$("#form_search label").finish().animate({opacity: 0}, 400); 
	});
	
	// on focus effects for login fields
	$("#form_login").find('.query').focus(function() { 
		if($(this).val() == $(this).attr("value")) $(this).val(""); 
		$("#form_login label").finish().animate({opacity: 1}, 400);
	});
	$("#form_login").find('.query').blur(function() { 
		if(!$(this).val()) $(this).val($(this).attr("value"));
		$("#form_login label").finish().animate({opacity: 0}, 400); 
	});
	
	// seller's form - on isbn entry
	var timer;
	$("#isbn").on("keyup change", function(){
		clearTimeout(timer);
		timer = setTimeout(updateSell, 200);
	});
});

$(window).resize(function()
{
	buySellResize();
	backdropFX();
});