import React, {Component} from 'react';
import moment from 'moment';
import _ from 'underscore';
import Table from 'react-bootstrap/lib/Table';
import {WindowResizeListener} from 'react-window-resize-listener';

export default class ReactGantt extends Component {
	constructor() {
		super();
		this.state = {
			tableId: _.sample('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 32).join(''),
			scaleMarksCount: 99,
			scaleDrawn: false
		}
	}

	renderBar(row) {
		var difference = moment(this.props.options.leftBound).unix();
		var rightBound = moment(this.props.options.rightBound).unix() - difference;
		var startDate = moment(row.startDate).unix() - difference;
		if (startDate < 0) {
			startDate = 0;
		} else if (startDate > rightBound) {
			startDate = rightBound;
		}
		var climaxDate = moment(row.climaxDate).unix() - difference;
		if (climaxDate < 0) {
			climaxDate = 0;
		} else if (climaxDate > rightBound) {
			climaxDate = rightBound;
		}
		var endDate = moment(row.endDate).unix() - difference;
		if (endDate < 0) {
			endDate = 0;
		} else if (endDate > rightBound) {
			endDate = rightBound;
		}
		var leftPadWidth = (startDate / rightBound * 100) + '%';
		var div1Width = ((climaxDate - startDate) / rightBound * 100) + '%';
		var div2Width = ((endDate - climaxDate) / rightBound * 100) + '%';
		var rightPadWidth = ((rightBound - endDate) / rightBound * 100) + '%';
    var div1BackgroundColor = 'blue';
    if (row.beforeClimaxColor) {
      div1BackgroundColor = row.beforeClimaxColor;
    } else if (this.props.options.beforeClimaxColor) {
      div1BackgroundColor = this.props.options.beforeClimaxColor;
    }
    var div2BackgroundColor = 'red';
    if (row.afterClimaxColor) {
      div2BackgroundColor = row.afterClimaxColor;
    } else if (this.props.options.afterClimaxColor) {
      div2BackgroundColor = this.props.options.afterClimaxColor;
    }
		var bar1 = {
			marginTop: '2px',
			marginBottom: '2px',
			marginLeft: leftPadWidth,
			marginRight: '0px',
			backgroundColor: div1BackgroundColor,
			width: div1Width,
			float: 'left',
			height: '30px',
      borderTopLeftRadius: '10px',
      borderBottomLeftRadius: '10px',
      boxShadow: '2px 2px 4px #000000'
		};
		var bar2 = {
			marginTop: '2px',
			marginBottom: '2px',
			marginLeft: '0px',
			marginRight: rightPadWidth,
			backgroundColor: div2BackgroundColor,
			width: div2Width,
			float: 'left',
			height: '30px',
      borderTopRightRadius: '10px',
      borderBottomRightRadius: '10px',
      boxShadow: '2px 2px 4px #000000'
		};
		return (
			<div>
				<div style={bar1}></div>
				<div style={bar2}></div>
			</div>
		);
	}

	renderRows() {
		var rows = [];
		var labelWidth = '80px';
		if (this.props.options && this.props.options.labelWidth) {
			labelWidth = this.props.options.labelWidth;
		}
		var titleStyle = {
			textAlign: 'right',
      verticalAlign: 'middle',
			paddingRight: '10px',
			fontWeight: 'bold'
		};
		var timelineStyle = {
			width: '50%'
		};
		if (this.props.options.showBorders !== false) {
			titleStyle.border = 'solid';
			timelineStyle.border = 'solid';
		}
		var labelStyle = {
			width: labelWidth
		};
		if (this.props.rows.length > 0) {
			for(var i = 0; i < this.props.rows.length; i++) {
				var rowObject = this.props.rows[i];
				var row = (
					<tr key={i}>
						<td style={titleStyle}>
							<div style={labelStyle}>{rowObject.title}</div>
						</td>
						<td style={timelineStyle}>
							{this.renderBar(rowObject)}
						</td>
					</tr>
				);
				rows.push(row);
			}
		} else {
			var row = (
				<tr key={0}>
					<td style={titleStyle}>
						<div style={labelStyle}></div>
					</td>
					<td style={timelineStyle}>
						<span>No Data</span>
					</td>
				</tr>
			);
			rows.push(row);
		}
		return rows;
	}

	drawScale() {
		var leftBound = this.props.options.leftBound;
		var rightBound = this.props.options.rightBound;
		var minutes = 0;
		var hours = 0;
		var days = 0;
		var weeks = 0;
		var months = 0;
		var years = moment(rightBound).diff(moment(leftBound), 'years');
		if (years < 2) {
			var months = moment(rightBound).diff(moment(leftBound), 'months');
			if (months < 6) {
				var days = (moment(rightBound).unix() - moment(leftBound).unix()) / 24 / 60 / 60;
				if (days < 2) {
					var hours = moment(rightBound).diff(moment(leftBound), 'hours');
					if (hours < 1) {
						var minutes = moment(rightBound).diff(moment(leftBound), 'minutes');
						this.setState({scale: this.calculateScale(minutes, 'minutes')});
					} else {
						this.setState({scale: this.calculateScale(hours, 'hours')});
					}
				} else {
					this.setState({scale: this.calculateScale(days, 'days')});
				}
			} else {
				this.setState({scale: this.calculateScale(months, 'months')});
			}
		} else {
			this.setState({scale: this.calculateScale(years, 'years')});
		}
	}

	calculateScale(count, type) {
		var difference = moment(this.props.options.leftBound).unix();
		var widthByTime = moment(this.props.options.rightBound).unix() - difference;
		var scale = document.querySelector('#' + this.state.tableId + ' > thead td:nth-child(2)');
		var widthByPixels = scale.offsetWidth;
		var markersCount = Math.round(widthByPixels / 100);
		var unitByPixels = widthByPixels / count;
		var maxIntervalWidth = 100;
		if (this.props.options.maxIntervalWidth) {
			maxIntervalWidth = this.props.options.maxIntervalWidth;
		}
		var unitsPerInterval = 1;
		if (maxIntervalWidth > unitByPixels) {
			unitsPerInterval = Math.floor(maxIntervalWidth / unitByPixels);
		}
		var intervalByPixels = unitsPerInterval * unitByPixels;
		var markersCount = Math.floor(widthByPixels / intervalByPixels);
    var intervalByPercent = intervalByPixels / widthByPixels * 100;
		var markers = [];
		var style = {
			margin: '0px',
			padding: '0px',
			width: intervalByPercent + '%',
			float: 'left',
			borderLeft: 'solid',
			borderWidth: '1px',
			paddingLeft: '5px'
		};
		for (var i = 0; i < markersCount; i++) {
			var date = moment(difference * 1000);
			switch (type) {
				case 'years':
					date.add(i * unitsPerInterval, 'years');
					break;
				case 'months':
					date.add(i * unitsPerInterval, 'months');
					break;
				case 'days':
					date.add(i * unitsPerInterval, 'days');
					break;
				default:
			}
			var mark = (
				<div key={i} style={style}>
					{date.format('YYYY MM DD')}
				</div>
			);
			markers.push(mark);
		}
		return (
			<div>
				{markers}
			</div>
		);
	}

	componentWillMount() {
		this.bootstraped = false;
		if (this.props.options.bootstraped) {
			this.bootstraped = this.props.options.bootstraped;
		}
	}

	componentDidMount() {
		this.previousProps = this.props;
		this.drawScale();
	}

	componentDidUpdate() {
		if (this.previousProps.options !== this.props.options || this.previousProps.rows !== this.props.rows) { // prevents infinite loop
			this.previousProps = this.props;
			this.drawScale();
		}
	}

	render() {
		var tableStyle = {
			width: '100%'
		};
		var scaleStyle = {
			width: '100%'
		};
		if (this.bootstraped) {
			return (
				<div>
					<Table id={this.state.tableId} style={tableStyle} striped bordered condensed hover>
						<thead>
							<tr>
								<td></td>
								<td style={scaleStyle}>{this.state.scale}</td>
							</tr>
						</thead>
						<tbody>
							{this.renderRows()}
						</tbody>
					</Table>
          <WindowResizeListener onResize={windowSize => {this.drawScale()}} />
				</div>
			);
		} else {
			return (
				<div>
					<table id={this.state.tableId} style={tableStyle}>
						<thead>
							<tr>
								<td></td>
								<td style={scaleStyle}>{this.state.scale}</td>
							</tr>
						</thead>
						<tbody>
							{this.renderRows()}
						</tbody>
					</table>
          <WindowResizeListener onResize={windowSize => {this.drawScale()}} />
				</div>
			);
		}
	}
}
