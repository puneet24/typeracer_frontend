/*
  Appbase credentials.
*/
var appbase = new Appbase({
  url: 'https://scalr.api.appbase.io',
  appname: 'typeracer',
  username: '0IQiaHcqh',
  password: 'e19f9e4a-7e75-4a9f-b95f-d94882ed135c'
});

var LeaderStatus = React.createClass({
	getInitialState : function() {
    	return {lstatus : null, countdown : null};
  	},
	componentWillMount : function(){
		/* Just to fetch Starting stauts */
		var statusobj = this;
		appbase.get({
      		type: 'board',
		    id: '1'
		}).on('data', function(response) {
		    console.log(response);
		    statusobj.setState({ lstatus : response._source.lstatus });
		    statusobj.setState({ countdown : response._source.countdown });
		}).on('error', function(error) {
		    console.log(error);
		});
		
	},
	componentDidMount : function(){
		/* Further Updates of Board */
		var statusobj = this;
		appbase.getStream({
      		type: 'board',
      		id: '1'
		}).on('data', function(response) {
      		statusobj.setState({ lstatus : response._source.lstatus });
      		statusobj.setState({ countdown : response._source.countdown });
		}).on('error', function(error) {
      		console.log("getStream() failed with: ", error)
		});
	},
	render : function(){
		var statusobj = this;
		return (
			<div className = "row">
				<div className = "col-md-3"><b>Status</b> : {this.state.lstatus}</div>
				<div className = "col-md-3"><b>Countdown</b> : {statusobj.state.countdown}</div>
			</div>
		);
	}
});

var User = React.createClass({
	getInitialState : function() {
		return {lettercount : null};
	},
	componentWillMount : function() {
		var userobj = this;
		appbase.get({
      		type: 'users',
      		id: userobj.props.userid
		}).on('data', function(response) {
      		userobj.setState({ lettercount : response._source.lettercount });
		}).on('error', function(error) {
      		console.log("getStream() failed with: ", error)
		});
	},
	componentDidMount : function() {
		var userobj = this;
		appbase.getStream({
      		type: 'users',
      		id: userobj.props.userid
		}).on('data', function(response) {
      		userobj.setState({ lettercount : response._source.lettercount });
		}).on('error', function(error) {
      		console.log("getStream() failed with: ", error)
		});
	},
	render : function() {
		var userobj = this;
		var tabstyle = {
			position: 'relative',
			left: Math.floor((userobj.state.lettercount *830)/userobj.props.quotelen),
			top:0
		}
		var namestyle = {
			'margin-top': '12px'
		}
		return (
			<div className = "row">
				<div style={namestyle} className="col-md-1"><b>{userobj.props.special}</b></div>
				<div className="col-md-9 progressbar">
					<table style={tabstyle}>
						<tbody>
							<tr>
								<td><img src="mario.jpg" style={{height: '30px'}}></img></td>
							</tr>
						</tbody>
					</table>
				</div>
				<div className="col-md-2"><b>lettercount</b> : {this.state.lettercount}</div>
			</div>
		);
	}
});

var LeaderBoard = React.createClass({
	getInitialState : function() {
		return { userinfo : [] }
	},
	componentWillMount : function() {
		var boardobj = this;
		appbase.search({
			type: "users",
		  	body: {
		    	query: {
		      		match_all: {}
		    	}
			}
		}).on('data', function(res) {
			console.log("query result: ", res);
			console.log(res);
		  	for(var i = 0;i < res.hits.total;i++){
		  		var obj = {userid : res.hits.hits[i]._id, lettercount : res.hits.hits[i]._source.lettercount};
		  		boardobj.setState({ userinfo : boardobj.state.userinfo.concat([obj]) });
		  	}
		}).on('error', function(err) {
		  	console.log("search error: ", err);
		});
	},
	componentDidMount : function() {
		var boardobj = this;
		appbase.searchStream({
    		type: 'users',
    		body: {
        		query: {
            		match_all: {}
        		}
    		}
		}).on('data', function(res) {
    		console.log("searchStream(), new match: ", res);
    		if(res._deleted != true){
    			var temp = boardobj.state.userinfo;
    			for(var i = 0;i<boardobj.state.userinfo.length;i++){
					if(boardobj.state.userinfo[i].userid == res._id){
						temp.splice(i,1);
						break;
					}
				}
    			var obj = {userid : res._id, lettercount : res._source.lettercount};
    			temp = temp.concat(obj);
		  		boardobj.setState({ userinfo : temp });
		  	}
		}).on('error', function(error) {
    		console.log("caught a searchStream() error: ", error)
		});
		appbase.getStream({
			type: 'board',
			id: '1'
		}).on('data', function(response) {
			if(response._source.lstatus == "end" && parseInt(response._source.countdown) == 2)
				boardobj.setState({ userinfo : [] });
		}).on('error', function(err) {
		  	console.log("search error: ", err);
		});
	},
	render : function() {
		var boardobj = this;
		console.log(boardobj.props.pid);
		return (
			<div className="well">
			{
				this.state.userinfo.map(function(user){
					if(user.userid == boardobj.props.pid)
						return (
							<User key={user.userid} quotelen={boardobj.props.quotelen} special={"you"} lettercount={user.lettercount} userid={user.userid} />
						)
					else
						return (
							<User key={user.userid} quotelen={boardobj.props.quotelen} special={"guest"} lettercount={user.lettercount} userid={user.userid} />
						)
				})
			}
			</div>
		);
	}
});

var PlayerBoard = React.createClass({
	getInitialState : function() {
		return {pid : null,lettercount : 0,btnstatus : "none",quote : "",quotestatus : "none",textstatus : "none",a : "",b : "",c : ""}
	},
	componentWillMount : function() {
		var playerobj = this;
		appbase.get({
      		type: 'board',
		    id: '1'
		}).on('data', function(response) {
		    console.log(response);
		    playerobj.setState({ quote : response._source.quote });
		    console.log(playerobj.state.quote);
		    playerobj.setState({ a : playerobj.state.quote.substring(0,parseInt(playerobj.state.lettercount)) });
			playerobj.setState({ b : playerobj.state.quote.substring(parseInt(playerobj.state.lettercount),parseInt(playerobj.state.lettercount)+1) });
			playerobj.setState({ c : playerobj.state.quote.substring(parseInt(playerobj.state.lettercount)+1) });
		    if(response._source.lstatus == "begin")
		    	playerobj.setState({ btnstatus : "block" });
		   	else
		    	playerobj.setState({ btnstatus : "none" });
		    if(response._source.lstatus == "running")
		    	playerobj.setState({ quotestatus : "block" });
		    else
		    	playerobj.setState({ quotestatus : "none" });
		}).on('error', function(error) {
		    console.log(error);
		});
	},
	componentDidMount : function() {
		var playerobj = this;
		appbase.getStream({
			type: 'board',
			id: '1'
		}).on('data', function(response) {
			if(response._source.lstatus == "running" && playerobj.state.pid != null)
				playerobj.setState({ textstatus : "block" });
			else
				playerobj.setState({ textstatus : "none" });
			if(response._source.lstatus == "end"){
				playerobj.setState({ pid : null });
				playerobj.setState({ lettercount : 0 })

			}
			if(response._source.lstatus == "begin" && parseInt(response._source.countdown) == 2){
				playerobj.setState({ quote : response._source.quote });
				playerobj.setState({ a : playerobj.state.quote.substring(0,parseInt(playerobj.state.lettercount)) });
				playerobj.setState({ b : playerobj.state.quote.substring(parseInt(playerobj.state.lettercount),parseInt(playerobj.state.lettercount)+1) });
				playerobj.setState({ c : playerobj.state.quote.substring(parseInt(playerobj.state.lettercount)+1) });
			}
			if(response._source.lstatus == "begin" && playerobj.state.pid == null){
				playerobj.setState({ btnstatus : "block" });
			}
			else
				playerobj.setState({ btnstatus : "none" });
			if(response._source.lstatus == "running")
				playerobj.setState({ quotestatus : "block" });
			else
				playerobj.setState({ quotestatus : "none" });
		}).on('error', function(err) {
		  	console.log("search error: ", err);
		});
		$(document.body).on('keypress', playerobj.handleKeyDown);
	},
	handleKeyDown : function(e) {
		var playerobj = this;
		if(playerobj.state.quotestatus == "block"){
			if(e.keyCode == playerobj.state.quote[playerobj.state.lettercount].charCodeAt()){
				playerobj.setState({ lettercount : parseInt(playerobj.state.lettercount) + 1 });
				playerobj.setState({ a : playerobj.state.quote.substring(0,parseInt(playerobj.state.lettercount)) });
				playerobj.setState({ b : playerobj.state.quote.substring(parseInt(playerobj.state.lettercount),parseInt(playerobj.state.lettercount)+1) });
				playerobj.setState({ c : playerobj.state.quote.substring(parseInt(playerobj.state.lettercount)+1) });
				if(playerobj.state.lettercount == playerobj.state.quote.length){
					appbase.index({
			 		    type: 'users',
			 		    id: playerobj.state.pid,
			 		    body: {"lettercount" : playerobj.state.lettercount, "finish" : "true"}
			 		}).on('data', function(response) {
			     		console.log(response);
			 		}).on('error', function(error) {
			 		    console.log(error);
			 		});
			 	}
			 	else{
			 		appbase.index({
			 		    type: 'users',
			 		    id: playerobj.state.pid,
			 		    body: {"lettercount" : playerobj.state.lettercount}
			 		}).on('data', function(response) {
			     		console.log(response);
			 		}).on('error', function(error) {
			 		    console.log(error);
			 		});
			 	}
			}
		}
        console.log(e.keyCode);

	},
	onStart : function() {
		var playerobj = this;
		appbase.index({
 		    type: 'users',
 		    body: {"lettercount" : 0}
 		}).on('data', function(response) {
     		console.log(response);
     		playerobj.setState({ pid : response._id });
     		playerobj.setState({ btnstatus : "none" });
 		}).on('error', function(error) {
 		    console.log(error);
 		});
	},
	render : function() {
		var playerobj = this;
		var styling = "display : "
		return (
			<div>
				<LeaderBoard Key="board" pid={playerobj.state.pid} quotelen={playerobj.state.quote.length} />
				<div className="row">
				<div className="col-md-3"></div>
				<div className="col-md-2"></div>
				<div className="col-md-2"><button className={"btn btn-primary "} style={{display : playerobj.state.btnstatus}} onClick={this.onStart}>Start Game</button></div>
				</div><br/>
				<div className="well quote" style={{display : playerobj.state.quotestatus}}>
					<span style={{color:"red"}}>{playerobj.state.a}</span>
					<span style={{color:"black"}}><u>{playerobj.state.b}</u></span>
					<span style={{color:"black"}}>{playerobj.state.c}</span>
				</div>
			</div>
		);
	}
});

ReactDOM.render(
  <LeaderStatus />,
  document.getElementById('leader_status')
);

ReactDOM.render(
  <PlayerBoard />,
  document.getElementById('player_board')
);