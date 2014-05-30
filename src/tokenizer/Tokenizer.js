(function () {
	'use strict';

	function Tokenizer(options) {
		options = options || {};
		var ws = !!options.whitespace;
		var comments = !!options.comments;
		var coords = !!options.coords;

		var token, tokenV;
		if (coords) {
			token = function (type, value, coords) {
				return {
					type: type,
					value: value,
					coords: coords
				};
			};

			tokenV = function (type, coords) {
				return {
					type: type,
					coords: coords
				};
			};
		} else {
			token = function (type, value) {
				return {
					type: type,
					value: value
				};
			};

			tokenV = function (type) {
				return {
					type: type
				};
			};
		}

		function stringSingle(str) {
			str.setMarker();
			str.advance();

			while (true) {
				if (str.current() == '\\') {
	                str.advance();
	            } else if (str.current() === "'") {
	                str.advance();
	                return token('string', JSON.parse('"' +
						str.getMarked().slice(1, -1).replace(/([^\\])(?=")/g, '$1\\') +
						'"'), str.getCoords());
	            } else if (str.current() === '\n' || !str.hasNext()) {
	                var ex = new Error('String not properly ended');
	                ex.coords = str.getCoords();
	                throw ex;
	            }

				str.advance();
			}
		}

		function stringDouble(str) {
			str.setMarker();
			str.advance();

	        while (true) {
	            if (str.current() === '\\') {
	                str.advance();
	            } else if (str.current() === '"') {
	                str.advance();
	                return token('string', JSON.parse(str.getMarked()), str.getCoords());
	            } else if (str.current() === '\n' || !str.hasNext()) {
	            	var ex = new Error('String not properly ended');
	                ex.coords = str.getCoords();
	                throw ex;
	            }

	            str.advance();
	        }
		}

		function number(str) {
			str.setMarker();

			var tmp = str.current();
			while (tmp >= '0' && tmp <= '9') {
				str.advance();
				tmp = str.current();
			}

			if (str.current() == '.') {
				str.advance();
				var tmp = str.current();
				while (tmp >= '0' && tmp <= '9') {
					str.advance();
					tmp = str.current();
				}
			}

			if (') \n\t'.indexOf(str.current()) === -1) {
	            var ex = new Error("Unexpected character '" +
	                str.current() + "' after '" +
	                str.getMarked() + "'");
	            ex.coords = str.getCoords();
	            throw ex;
	        }

			return token('number', +str.getMarked(), str.getCoords());
		}

		function commentMulti(str) {
			str.setMarker();
			str.advance();
			str.advance();

			while (true) {
				if (str.current() === '-' && str.next() === ';') {
					str.advance();
					str.advance();
	                return token('comment', str.getMarked(), str.getCoords());
				} else if (str.hasNext()) {
					str.advance();
				} else {
					var ex = new Error('Multiline comment not properly terminated');
	                ex.coords = str.getCoords();
	                throw ex;
				}
			}
		}

		function commentSingle(str) {
			str.setMarker();
			str.advance();

			while (true) {
				if (str.current() === '\n' || !str.hasNext()) {
					str.advance();
	                return token('comment', str.getMarked(), str.getCoords());
				} else {
					str.advance();
				}
			}
		}

		function alphanum(str) {
			str.setMarker();

			var tmp = str.current();
			while (tmp > ' ' && tmp <= '~' && (tmp != '(' && tmp != ')')) {
				str.advance();
				tmp = str.current();
			}

	        return token('alphanum', str.getMarked(), str.getCoords());
		}

		function whitespace(str) {
			var tmp = str.current();
			str.advance();
			return token('whitespace', tmp, str.getCoords());
		}

		return function chop(string) {
			var str = new espace.IterableString(string + ' ');
			var tokens = [];

			while (str.hasNext()) {
				var current = str.current();

				// TODO: use a table instead
				if (current === "'") {
					tokens.push(stringSingle(str));
				} else if (current === '"') {
					tokens.push(stringDouble(str));
				} else if (current === ';') {
					var next = str.next();

					if (next === '-') {
						var tmp = commentMulti(str);
						if (comments) { tokens.push(tmp); }
					} else {
	                    var tmp = commentSingle(str);
	                    if (comments) { tokens.push(tmp); }
					}
				} else if (current >= '0' && current <= '9') {
					tokens.push(number(str));
				} else if (current === '(') {
					tokens.push(tokenV('(', str.getCoords()));
					str.advance();
				} else if (current === ')') {
					tokens.push(tokenV(')', str.getCoords()));
					str.advance();
				} else if (current > ' ' && current <= '~') {
					tokens.push(alphanum(str));
				} else {
					var tmp = whitespace(str);
					if (ws) { tokens.push(tmp); }
				}
			}

			//tokens.push(tokenV('END', str.getCoords()));

			return tokens;
		};
	}

    window.espace = window.espace || {};
    window.espace.Tokenizer = Tokenizer;
})();
