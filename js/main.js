//Event handlers
$(document).ready(function() {
	//Виведення попередження
	function attention(text, timeout) {
		$('.attention').text(text);
		$('.attention').fadeIn();
		setTimeout(function() {
			$('.attention').fadeOut();
		}, timeout);
	}
	//Не клацати по картинкам!
	$('img').on('click', function() {
		attention('Don\'t click on screenshots! They are for an example. Type usernames ABOVE :D', 4000);
	});
	//Починати по ЕНТЕРУ
	$('input').keyup(function(event) {
		if (event.keyCode == 13) {
			$('#compare').click();
		}
	});
	$('#compare').on('click', function() {
		//Зробити елементи DISABLED
		$('table input, #period, #user2').attr({
			disabled: true
		});
		$('.twitter-typeahead input').css({
			'background-color': '#333'
		});
		$('#period').css({
			'background-color': '#ececec'
		});
		//
		$('header table td:eq(4)').append('<a href="" id="again">Try again?</a>');
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
			attention('Usernames aren\'t valid. Try again.', 3000);
			setTimeout(function() {
				window.location.reload()
			}, 3000);
		}
	});
	//Запуск по хешу із адресного рядка
	var hash = window.location.hash.split('#');
	if (hash.length > 1) {
		$('#user1').val(hash[1]);
		$('#user2').val(hash[2]);
		$('select').val(hash[3]);
		$('#compare').click();
	}
});
var artists = {},
	playcount = {},
	ret = [],
	indx = {},
	commonObj = {},
	indexesInSecod = [],
	numberOfTotalPlays = {},
	dominantings = [0, 0], //В першому полі кількість домінуючих виконавців першого користувача
	totalCommonPlays = [0, 0]; //Загальна кількість прослуховувань спільних виконавців

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
				//Загальна кількість виконавців кожного за даний період
				numberOfTotalPlays[user] = parseInt(json.topartists['@attr'].total);
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
				attention('Something went wrong. Check entered usernames.', 3000);
				setTimeout(function() {
					window.location.reload()
				}, 3000);
			}
		});
	}
	repeat(user, page, period);
}

function fetch(ar, pl) {
	if ($('#wrapper table#main tr').length < 3) {
		for (var i in ar) {
			$('#wrapper table#main tr:last').after('<tr><td>' + ar[i] + '</td><td>' + pl[i] + '</td><td></td><td></td></tr>');
			if (i == ar.length - 1) {
				getArtists($('#user2').val(), 1, $('#period').val());
			}
		}
	} else {
		for (var i in ar) {
			var eq = parseInt(parseInt(i) + 1);
			$('#wrapper table#main tr:eq(' + eq + ') td:eq(2)').text(pl[i]);
			$('#wrapper table#main tr:eq(' + eq + ') td:eq(3)').text(ar[i]);
			//Якщо у другого користувача більше виконавців - додати нові рядочки
			if ($('#wrapper table#main tr:eq(' + eq + ') td:eq(2)').length < 1) {
				$('#wrapper table#main tr:last').after('<tr><td></td><td></td><td>' + pl[i] + '</td><td>' + ar[i] + '</td></tr>');
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
				//Обчислення кількості домінуючих виконавців у кожного
				for (var i in commonObj) {
					var compared = [
						parseInt(commonObj[i][0]),
						parseInt(commonObj[i][1])
					];
					if (compared[0] > compared[1]) {
						dominantings[0] += 1;
					} else {
						dominantings[1] += 1;
					}
					//Обчислення кількості прослуховувань спільних виконавців у кожного
					totalCommonPlays[0] += compared[0];
					totalCommonPlays[1] += compared[1];
				}
				console.log('dominantings', dominantings);
				var zz = 0;
				$('#wrapper table#main tr').remove();
				for (var i in commonObj) {
					var eq = zz;
					//parseInt(parseInt(zz) + 0);
					$('#wrapper table#main').append('<tr><td>' + ret[zz] + '</td><td>' + commonObj[i][0] + '</td><td>' + commonObj[i][1] + '</td><td>' + ret[zz] + '</td><tr>');
					zz++;
				}
				//Видалити зайві рядочки
				for (var i = 0; i < $('tr').length; i++) {
					if ($('tr').eq(i).text().length < 1) {
						$('tr').eq(i).remove();
					}
				}
				//Вставити заголовок
				$('#wrapper table#main tbody').before('<thead><tr><th>Common Artist</th><th>Playcount</th><th>Playcount</th><th>Common Artist</th></tr></thead>');
				$('#wrapper table#main').tablesorter(); //Ініціалізація скрипту сортування

				hightlightBold();
				commonStat();
				//Посилання для шарінгу результатом
				$('.share input').val('http://lastfm.eu5.org/compare/' + '#' + $('#user1').val() + '#' + $('#user2').val() + '#' + $('select').val());
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
			td1.addClass('bold');
		} else if (parseInt(td1.text()) !== parseInt(td2.text())) {
			td2.addClass('bold');
		}
	}
}

function commonStat() {
	var u1 = $('#user1').val(),
		u2 = $('#user2').val();
	$('#additional').before('<h1 class="center">Additional stats<h1>');
	$('table#additional tr:eq(0)').after('<tr><td><span class="notp">' + dominantings[0] + '</span> artists with more plays than in <span class="bold">' + u2 + '</span></td><td>' + totalCommonPlays[0] + '</td><td>' + totalCommonPlays[1] + '</td><td><span class="notp">' + dominantings[1] + '</span> artists with more plays than in <span class="bold">' + u1 + '</span></td></tr>');
	hightlightBold();
	$('table#additional tr:eq(0)').html('<td><span class="notp">' + numberOfTotalPlays[u1] + '</span> artists</td><td colspan="2"><span class="notp">' + ret.length + '</span> in common</td><td><span class="notp">' + numberOfTotalPlays[u2] + '</span> artists</td>');
	//Чи видно останній рядок таблиці?
	function checkPositionAndShow() {
		if ($(window).scrollTop() >= $('tr:last').position().top - 400 && $('thead:visible').length > 0) {
			$('.share').fadeIn(777);
		}
	}
	checkPositionAndShow();
	//Показувати його лише при прокручуванні до кінця
	$(window).scroll(function() {
		checkPositionAndShow();
	});
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

//Typehead
$(document).ready(function() {
	var substringMatcher = function(strs) {
		return function findMatches(q, cb) {
			var matches, substringRegex;
			matches = [];
			substrRegex = new RegExp(q, 'i');
			$.each(strs, function(i, str) {
				if (substrRegex.test(str)) {
					matches.push({
						value: str
					});
				}
			});
			cb(matches);
		};
	};
	var friends = [];
	$('.typeahead').typeahead({
		hint: true,
		highlight: true,
		minLength: 1
	}, {
		name: 'friends',
		displayKey: 'value',
		source: substringMatcher(friends)
	});
	$('#user2').on('focus', function() {
		var u1 = $('#user1').val();
		$.getJSON('http://ws.audioscrobbler.com/2.0/?method=user.getfriends&user=' + u1 + '&limit=200&api_key=5ddb360d1e5fa830834e4b9ec479b7c6&format=json', function(json) {
			for (var i in json.friends.user) {
				friends[i] = (json.friends.user[i].name);
			}
			console.log(friends);
		});
	});
});