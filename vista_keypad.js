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

	set lcd_comm (lcd_comm) {
		super.lcd_comm = lcd_comm;
		document.getElementById('lcd-comm').innerHTML = lcd_comm ? 'Comm' : '';
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