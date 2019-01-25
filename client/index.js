const request = require('superagent');

var agent = request.agent();
var url = "http://127.0.0.1:3000";

function validate() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  
  if (username == "" || password == "") {
    alert('Error: Username or password was not provided');
    return false;
  }

  var userInfo;
  var user = (agent
    .post(url + '/auth/allcancode')
    .query({
        org: 'allcancode'
    })
    .timeout(60000)
    .send({
        username: username,
        password: password,
    })
    .then(res => {
     fillDropDown(res);
    })).body;
}

function fillDropDown(res) {

  var getProjects = (agent
    .get(url + '/api/projects')
    .query({
      filter: 'all',
      components: true
    })
    .timeout(60000)
    .then(res => {
      var select = document.getElementById("projects");
      var options = res.body.components;
      for (var i = 0; i < options.length; i++) {
        var opt = options[i].projectName;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
      }
    })).body;
}

// Create a CSIneterface instance
var csInterface = new CSInterface();
var openButton = document.querySelector("#analyze");
openButton.addEventListener("click", analyzeImage);

function analyzeImage() {
  //alert('Here and trying to analyze and still trying too');
  var promise1 = new Promise(function(resolve, reject) {
    setTimeout(function() {
      csInterface.evalScript("bootstrap()");
    }, 30);
  });
  promise1.then(function(){
    alert("Done here moving to transfer");
  });
}