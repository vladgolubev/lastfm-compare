//Event handlers
$(document).ready(function() {
	$('header p:first').on('click', function() {
		location.reload();
	});
	//Починати по ЕНТЕРУ
	$('input').keyup(function(event) {
		if (event.keyCode == 13) {
			$('#compare').click();
		}
	});
	$('#compare').on('click', function() {
		//Зробити елементи DISABLED
		$('input, #period').attr({
			disabled: true
		});
		$('#period').css({'background-color': '#ececec'});
		//
		$('#inputs').append('<a href="">Try again?</a>');
		$('#compare, .howto').remove();
		var i1 = $('#user1');
		var i2 = $('#user2');
		var period = $('#period').val();
		if (i1.val().length > 2 && i2.val().length > 2) {
			var user1 = i1.val();
			var user2 = i2.val();
			console.log(user1, user2);
			getArtists(user1, 1, period);
		} else {
			alert('Hey, you have to enter two valid usernames!');
		}
	});
});
var artists = {},
	playcount = {},
	ret = [],
	indx = {},
	commonObj = {},
	indexesInSecod = [];

function getArtists(user, page, period) {
	//Почати прогрес-бар
	NProgress.start();
	var page = 1,
		currPos = 0,
		endPos = 0;
	playcount[user] = [];
	artists[user] = [];

	var repeat = function(user, page, period) {
		$.getJSON('http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=' + user + '&period=' + period + '&limit=100&page=' + page + '&api_key=5ddb360d1e5fa830834e4b9ec479b7c6&format=json', function(json, text) {
			if (json.topartists !== undefined) {
				currPos = parseInt(json.topartists['@attr'].page);
				page = currPos + 1;
				endPos = parseInt(Math.ceil(json.topartists['@attr'].total / json.topartists['@attr'].perPage));
				var q = json.topartists.artist;
				for (var i = 0; i < q.length; i++) {
					if (q[i] !== undefined && q[i] !== '') {
						artists[user].push(q[i].name);
						playcount[user].push(q[i].playcount);
					}
					if (i === q.length - 1) {
						var pos = currPos / endPos;
						console.log(currPos, endPos, pos, json.topartists['@attr'].total);
						NProgress.set(pos);

						if (currPos !== endPos) {
							repeat(user, page, period);
						} else {
							fetch(artists[user], playcount[user])
							return;
						}
					}
				}
			} else {
				alert('                                ERROR!\n\n\n                        ACCESS DENIED!!!');
				alert('Now when you come to think of it, check if you entered correct usernames ;)');
			}
		});
	}
	repeat(user, page, period);
}

function fetch(ar, pl) {
	if ($('table tr').length < 3) {
		for (var i in ar) {
			$('table tr:last').after('<tr><td>' + ar[i] + '</td><td>' + pl[i] + '</td><td></td><td></td></tr>');
			if (i == ar.length - 1) {
				getArtists($('#user2').val(), 1, $('#period').val());
			}
		}
	} else {
		for (var i in ar) {
			var eq = parseInt(parseInt(i) + 1);
			$('table tr:eq(' + eq + ') td:eq(2)').text(pl[i]);
			$('table tr:eq(' + eq + ') td:eq(3)').text(ar[i]);
			//Якщо у другого користувача більше виконавців - додати нові рядочки
			if ($('table tr:eq(' + eq + ') td:eq(2)').length < 1) {
				$('table tr:last').after('<tr><td></td><td></td><td>' + pl[i] + '</td><td>' + ar[i] + '</td></tr>');
			}
			if (parseInt(i) === ar.length - 1) {
				var ret = intersect(artists[$('#user1').val()], artists[$('#user2').val()]);
				console.log(ret, ret.length);
				var u1 = $('#user1').val(); //Нікнейм
				var u2 = $('#user2').val(); //Нікнейм
				var arr1 = artists[u1]; //Список виконавців
				var play1 = playcount[u1]; //Кількість відтворень
				var arr2 = artists[u2]; //Список виконавців
				var play2 = playcount[u2]; //Кількість відтворень
				getIndexes(arr1, ret); //Індекси спільних в першого
				//Дізнатися індекси другого
				function returnLargerArr(arr1, arr2) {
					if (arr1.length > arr2.length) {
						return arr1;
					} else return arr2;
				}
				var larger = returnLargerArr(arr1, arr2);
				indexesInSecod = [];
				for (var i = 0; i < larger.length; i++) {
					for (var z = 0; z < larger.length; z++) {
						if (ret[i] === arr2[z]) {
							indexesInSecod.push(z); //Індекси спільних в другого!
						}
					}
				}

				for (var i = 0; i < ret.length; i++) {
					commonObj[ret[i]] = [
						play1[indx[i]],
						play2[indexesInSecod[i]]
					];
				}
				console.log(commonObj);
				var zz = 0;
				$('table tr').remove();
				for (var i in commonObj) {
					var eq = zz;
					//parseInt(parseInt(zz) + 0);
					$('table').append('<tr><td>' + ret[zz] + '</td><td>' + commonObj[i][0] + '</td><td>' + commonObj[i][1] + '</td><td>' + ret[zz] + '</td><tr>');
					zz++;
				}
				//Видалити зайві рядочки
				for (var i = 0; i < $('tr').length; i++) {
					if ($('tr').eq(i).text().length < 1) {
						$('tr').eq(i).remove();
					}
				}
				$('table tbody').before('<thead><tr><th>Common Artist</th><th>Playcount</th><th>Playcount</th><th>Common Artist</th></tr></thead>');
				$("table").tablesorter(); 

				hightlightBold();
			}
		}
	}
}


function intersect(x, y) {
	for (var i = 0; i < x.length; i++) {
		for (var z = 0; z < y.length; z++) {
			if (x[i] == y[z]) {
				ret.push(x[i]);
				break;
			}
		}
	}
	return ret;
}

function getIndexes(x, y) {
	indx = [];
	for (var i = 0; i < x.length; i++) {
		for (var z = 0; z < y.length; z++) {
			if (x[i] == y[z]) {
				indx.push(i);
				break;
			}
		}
	}
	return indx;
}

function hightlightBold() {
	for (var i = 0; i < $('tr').length; i++) {
		var td1 = $('tr:eq(' + i + ') td:eq(1)');
		var td2 = $('tr:eq(' + i + ') td:eq(2)');
		if (parseInt(td1.text()) > parseInt(td2.text())) {
			td1.css({'font-weight': 'bold'});
		} else if (parseInt(td1.text()) !== parseInt(td2.text())) {
			td2.css({'font-weight': 'bold'});
		}
	}
}
function getPlays(user, from, to) {
	console.log('getPlays called');
};
getPlays.lastDay = function(user) {
	var to = Math.round(Date.now() / 1000); //To present time
	var from = to - 86400; //From 24 h ago
	$.getJSON('http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + user + '&from=' + from + '&to=' + to + '&api_key=5ddb360d1e5fa830834e4b9ec479b7c6&format=json', function(json) {
		console.log(json);
		alert(json.recenttracks['@attr'].total);
	});
}


/*//Токен авторизації
function grabToken() {
	var token;
	if (window.location.href.indexOf('token')) {
		token = window.location.href.split('=')[1];
	}
	return token;
}
api_key5ddb360d1e5fa830834e4b9ec479b7c6methodauth.getSessiontokend49e35c5312092d360ea5c13f644c488mysecret
52b4961a8f4f18a5b76603dc92d7ac7b
$.getJSON('http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=5ddb360d1e5fa830834e4b9ec479b7c6&token=d49e35c5312092d360ea5c13f644c488&api_sig=52b4961a8f4f18a5b76603dc92d7ac7b&format=json', function(json) {
	console.log(json);
});*/