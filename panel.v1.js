class  AbstractKeypad {

	get MAX_TIME_BETWEEN_KEY_PRESSES() { return 2*1000; }  // TODO: this is dumb

	get last_cmd () { return this._last_cmd; }
	set last_cmd (cmd) { this._last_cmd = cmd; }
	get pending_request_status () { return this._pending_request_status; }
	set pending_request_status (pending_request_status) { this._pending_request_status = pending_request_status; }
	get request_balance () { return this._request_balance || 0; }
	set request_balance (balance) { this._request_balance = balance; this.lcd_communicating = balance > 0 || this.pending_request_status; }
	get focused () { return this._focused; }
	set focused (focused) { this._focused = focused; }
	get logged_in () { return this._logged_in; }
	set logged_in (logged_in) { this._logged_in = logged_in; }
	get cmd_queue () { return this._cmd_queue; }
	set cmd_queue (cmd_queue) { this._cmd_queue = cmd_queue; }
	get lcd () { return this._lcd || ['Connecting', 'please wait...']; }
	set lcd (lcd) { this._lcd = lcd; }
	get lcd_ready () { return this._lcd_ready || true; }
	set lcd_ready (lcd_ready) { this._lcd_ready = lcd_ready }
	get lcd_armed () { return this._lcd_armed || false; }
	set lcd_armed (lcd_armed) { this._lcd_armed = lcd_armed; }
	get lcd_bypass () { return this._lcd_bypass || false; }
	set lcd_bypass (lcd_bypass) { this._lcd_bypass = lcd_bypass; }
	get lcd_communicating () { return this._lcd_communicating || false; }
	set lcd_communicating (lcd_communicating) { this._lcd_communicating = lcd_communicating; }
	get websocket () { return this._websocket; }
	set websocket (websocket) { this._websocket = websocket; }
	get username () { return this._username; }
	set username (username) { this._username = username; }
	get password () { return this._password; }
	set password (password) { this._password = password; }
	get device_id () { return this._device_id; }
	set device_id (device_id) { this._device_id = device_id; }
	
	// ex:
	// new Panel(new WebSocket("wss://alarmdealer.com:8800/ws"), 'johndoe', '234234234234', '010121232032')
	constructor (websocket, username, password, device_id) {
		let me = this;

		this.websocket = websocket;
		this.username = username;
		this.password = password;
		this.device_id = device_id;

		this.cmd_queue = [];

		// close websocket cleanly on window unload
		window.onbeforeunload = function() {
		    this.websocket.onclose = function () {};
		    this.websocket.close();
		}.bind(this);

		// when websocket closes show appropriate message on the lcd screen
		this.websocket.onclose = function (event) {
			this.lcd = [ 'Connection Closed', '' ];
		}.bind(this);

		// handle initialization on websocket open
		this.websocket.onopen = this.startup_handler.bind(this);

		// handle incoming messages
		this.websocket.onmessage = this.message_handler.bind(this);
	}

	websocket_send (json) {
		++this.request_balance;
		this.clear_pending_request_status();
		// pace sends
		setTimeout(function () {
			this.websocket.send(JSON.stringify(json));
			console.log('sending', JSON.stringify(json));
		}.bind(this), 50);
	}

	send (msg) {
		this.cmd_queue.push(msg);
		// if this was the first key in a sequence
		// initiate send, subsequent keys will get
		// sent upon receipt of OK from server in
		// the message_handler
		console.log("Add message to queue", msg, this.request_balance, '**********');
		if (this.request_balance === 0) {
			this.send_next_cmd();
		}
	}

	send_next_cmd () {
		if (this.cmd_queue.length > 0) {
			let cmd = this.last_cmd = this.cmd_queue.shift();
			this.websocket_send({
				action: 'send_cmd',
				input: {
					cmd: cmd
				}
			});
		} else {
			this.request_status_delayed(500);
		}
	}	

	request_status_delayed (delay_ms) {
		this.clear_pending_request_status();
		this.pending_request_status = setTimeout(this.request_status.bind(this), delay_ms);
		console.log('status request', this.pending_request_status, 'scheduled in', delay_ms/1000, 's @', new Date());
	}

	request_status () {
		console.log('requesting status...', new Date());
		this.websocket_send({
			action: 'send_cmd',
			input: {
				cmd: 'status'  // should be "dstatus" for DSC
			}
		});
	}

	clear_pending_request_status () {
		clearTimeout(this.pending_request_status);
		console.log('cleared pending request', this.pending_request_status)
		this.pending_request_status = null;
	}

	message_handler (event) {
		let data = JSON.parse(event.data);

		--this.request_balance;

		console.log('status', data.status, 'balance', this.request_balance, 'last cmd', this.last_cmd, 'msg', data.msg, data);

		if (data.msg === 'Login failed') {
			this.logged_in = false;
			this.lcd = [
				'Login failed',
				''
			]
		}

		if (data.msg === 'Logged in successfully') {
			this.logged_in = true;
			this.websocket_send({
				action: 'select_device',
				input: {
					device_id: this.device_id
				}
			});
			return;
		}

		if (data.msg === 'Device is focused') {
			this.focused = true;
			if (this.logged_in && this.focused) {
				console.log('logged in and focused');
				this.request_status();
			} else {
				// todo: bad juju
			}
			return;
		}

		// server responded to a previous cmd send, e.g. key press
		if (data.status === 'OK' && data.data === '') {
			if (this.cmd_queue.length > 0) {
				this.send_next_cmd();
			} else {
				// cmd queue is empty, if there's no more input
				// from the user for a period of time, we'll
				// poll status from the server (e.g. the user
				// just entered code+away, we want a chance to
				// update display with an "all secure" message)
				// if there's input from user before, request_status_delayed 
				// will get cleared
				this.request_status_delayed(this.MAX_TIME_BETWEEN_KEY_PRESSES);

				// TODO: there's got to be a better way of handling this
			}
		}

		// message contains a payload
		// we'll parse it and apply cute heuristics
		if (data.data) {
			data = JSON.parse(data.data);
			this.lcd = [
				data.LCD_L1,
				data.LCD_L2
			]

			// server session timed out
			// TODO: try to handle by reopening websocket
			if (data.LCD_L1 === 'Session Timeout') {
				if (confirm('Session has timed out. Click OK to reload')) {
					location.reload();
				} else {
					this.websocket.close();
				}
			}

			// keep polling
			if (data.LCD_L1 === 'Test In Progress' || data.LCD_L1 === 'PHONE OK') {
				this.request_status_delayed(5*1000);
			}

			// this is stupid but works..
			if (data.LCD_L2 === 'You may exit now') {
				this.request_status_delayed(65*1000); // usually 60 seconds
			}

			this.lcd_ready = data.LCD_RL === '1';
			this.lcd_armed = data.LCD_AL === '1';
			this.lcd_bypass = data.LCD_BL === '1';
		}
	}

	// called when websocket is opened
	startup_handler () {
		console.log('starting up...');
		this.websocket_send({
			action: 'login',
			input: {
				username: this.username,
				epass: this.password,
				pass_hashed: 'true',  // server wants a string, go figure..
				user_type: 'user'
			}
		});
	}
}

class VistaKeypad extends AbstractKeypad {
	set lcd (lcd) {
		super.lcd = lcd;
		document.getElementById('status').innerHTML = `${lcd[0] || ''}&nbsp;<br>${lcd[1] || ''}&nbsp;`;
	}

	set lcd_ready (lcd_ready) {
		super.lcd_ready = lcd_ready;
		document.getElementById('lcd-ready').innerHTML = lcd_ready ? 'Ready' : '';
	}
	
	set lcd_armed (lcd_armed) {
		super.lcd_armed = lcd_armed;
		document.getElementById('lcd-armed').innerHTML = lcd_armed ? 'Armed' : '';
	}

	set lcd_bypass (lcd_bypass) {
		super.lcd_bypass = lcd_bypass;
		document.getElementById('lcd-bypass').innerHTML = lcd_bypass ? 'Bypass' : '';
	}

	set lcd_communicating (lcd_communicating) {
		super.lcd_communicating = lcd_communicating;
		document.getElementById('lcd-comm').innerHTML = lcd_communicating ? 'Comm' : '';
	}

	send (key, el) {
		super.send(key);

		if (el) {
			el.classList.add('pressed');
			setTimeout(function () {
				el.classList.remove('pressed');
			}, 200);
		}
	}
}