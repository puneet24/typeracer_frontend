/*
  Appbase credentials.
*/
var appbase = new Appbase({
  url: 'https://scalr.api.appbase.io',
  appname: 'typeracer',
  username: '0IQiaHcqh',
  password: 'e19f9e4a-7e75-4a9f-b95f-d94882ed135c'
});

var pid = 0;

function handler(){
	console.log("hello");
}

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
		this.setState({ lettercount : this.props.lettercount });
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
		return (
			<div className = "row">
				<b>lettercount</b> : {this.state.lettercount}
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
		return (
			<div className="well">
			{
				this.state.userinfo.map(function(user){
					return (
						<User key={user.userid} lettercount={user.lettercount} userid={user.userid} />
					)
				})
			}
			</div>
		);
	}
});

var PlayerBoard = React.createClass({
	getInitialState : function() {
		return {pid : null,lettercount : 0,btnstatus : "disabled",quote : "",textstatus : "none"}
	},
	componentWillMount : function() {
		var playerobj = this;
		appbase.get({
      		type: 'board',
		    id: '1'
		}).on('data', function(response) {
		    console.log(response);
		    playerobj.setState({ quote : response._source.quote });
		    if(response._source.lstatus == "end")
		    	playerobj.setState({ btnstatus : "disabled" });
		   	else
		    	playerobj.setState({ btnstatus : "" });
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
			if(response._source.lstatus == "end" || playerobj.state.pid != null){
				playerobj.setState({ btnstatus : "disabled" });
			}
			else
				playerobj.setState({ btnstatus : "" });
		}).on('error', function(err) {
		  	console.log("search error: ", err);
		});
	},
	onTyped : function() {
		var playerobj = this;
		console.log("hello");
		var quotemsg = playerobj.state.quote.substring(parseInt(playerobj.state.lettercount));
		var c = quotemsg.indexOf(" ");
		if(c != -1)
				quotemsg = quotemsg.substring(0,c+1);
		console.log(quotemsg);
		var data = document.getElementById("msg").value;
		if(data == quotemsg){
			document.getElementById("msg").value = "";
			var lc = parseInt(parseInt(playerobj.state.lettercount) + parseInt(data.length));
			playerobj.setState({ lettercount : lc })
			appbase.index({
	 		    type: 'users',
	 		    id: playerobj.state.pid,
	 		    body: {"lettercount" : lc}
	 		}).on('data', function(response) {
	     		console.log(response);
	 		}).on('error', function(error) {
	 		    console.log(error);
	 		});
		}
	},
	onStart : function() {
		var playerobj = this;
		appbase.index({
 		    type: 'users',
 		    body: {"lettercount" : 0}
 		}).on('data', function(response) {
     		console.log(response);
     		playerobj.setState({ pid : response._id });
     		console.log()
 		}).on('error', function(error) {
 		    console.log(error);
 		});
	},
	render : function() {
		var playerobj = this;
		var styling = "display : "
		return (
			<div>
				<LeaderBoard Key="board" />
				<button className={"btn btn-primary " + this.state.btnstatus} onClick={this.onStart}>Start Game</button>
				<div className="well" id="quote">{this.state.quote}</div>
				<input type="text" className="form-control" id="msg" onChange={this.onTyped} style={{display : playerobj.state.textstatus}}></input>
			</div>
		);
	}
});

ReactDOM.render(
  <LeaderStatus />,
  document.getElementById('leader_status')
);

// ReactDOM.render(
//   <LeaderBoard />,
//   document.getElementById('leader_board')
// );

ReactDOM.render(
  <PlayerBoard />,
  document.getElementById('player_board')
);