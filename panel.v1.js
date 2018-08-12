
class VistaKeypad {
	set conn (conn) {
		this._conn = conn;
	}

	get conn () {
		return this._conn;
	}

	set focused (focused) {
		this._focused = focused;
	}

	get focused () {
		return this._focused;
	}

	set logged_in (logged_in) {
		this._logged_in = logged_in;
	}

	get logged_in () {
		return this._logged_in;
	}

	get cmd_queue () {
		if (!this._cmd_queue) this._cmd_queue = [];
		return this._cmd_queue;
	}

	get lcd () {
		if (!this._lcd) this._lcd = ['Connecting', 'please wait...'];
		return this._lcd;
	}

	set lcd (lcd) {
		this._lcd = lcd;
	}

	// ex:
	// new Panel(new WebSocket("wss://alarmdealer.com:8800/ws"), 'johndoe', '234234234234', '010121232032')
	constructor (conn, username, epass, device_id) {
		let me = this;

		this._conn = conn;
		this._username = username;
		this._epass = epass;
		this._device_id = device_id;

		this.conn.onclose = function (event) {
			console.log('Connection closed');
			me.lcd = [
				'Connection Closed',
				''
			];
		}

		me.conn.onmessage = function (event) {
			me.message_handler(event);
		}

		me.conn.onopen = function (event) {
			console.log('connection open', conn.readyState)
			me.startup_handler(event);
		}
	}

	send (msg) {
		console.log("Add message to queue", msg);
		this.cmd_queue.push(msg);
		this.send_next_cmd();
	}

	send_next_cmd () {
		if (this.cmd_queue.length) {
			this.conn.send(JSON.stringify({
				action: 'send_cmd',
				input: {
					cmd: this.cmd_queue.shift()
				}
			}));
		} else {
			this.request_status();
		}
	}

	request_status () {
		console.log('requesting status...');
		this.conn.send(JSON.stringify({
			action: 'send_cmd',
			input: {
				cmd: 'status'  // should be "dstatus" for DSC
			}
		}));
	}

	keypress (key) {
		if (this.conn.readyState !== 1) return;
		this.send(key);
	}

	message_handler (event) {
		let data = JSON.parse(event.data);

		console.log('status', data.status, 'msg', data.msg, data);

		if (data.status !== 'OK') {
			// handle failure
			return;
		}

		if (data.msg === 'Logged in successfully') {
			this.logged_in = true;
			this._conn.send(JSON.stringify({
				action: 'select_device',
				input: {
					device_id: this._device_id
				}
			}));
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

		if (data.status === 'OK' && data.data === '') {
			if (this.cmd_queue.length > 0) {
				this.send_next_cmd();
			} else {
				let me = this;
				setTimeout(function () {
					me.request_status();
				},1000)
			}
		} else {
			console.log('unknown response', data);
		}

		if (data.data) {
			data = JSON.parse(data.data);
			this.lcd = [
				data.LCD_L1,
				data.LCD_L2
			]
		}

		document.getElementById('status').innerHTML = `${this.lcd[0]}&nbsp;<br>${this.lcd[1]}&nbsp;`;
		document.getElementById('lcd-ready').innerHTML = data.LCD_RL === '1' ? 'Ready' : '';
		document.getElementById('lcd-armed').innerHTML = data.LCD_AL === '1' ? 'Armed' : '';
		document.getElementById('lcd-bypass').innerHTML = data.LCD_BL === '1' ? 'Bypass' : '';
	}

	startup_handler () {
		console.log('starting up...');
		this.conn.send(JSON.stringify({
			action: 'login',
			input: {
				username: this._username,
				epass: this._epass,
				pass_hashed: 'true',  // string?
				user_type: 'user'
			}
		}));
	}
}