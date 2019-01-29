const request = require('superagent');
const dirSearch = require('C:/Program Files (x86)/Common Files/Adobe/CEP/extensions/my_first_extension/client/dirSearch/dirDFS.js');
const fs = require('fs');

var agent = request.agent();
var url = "http://127.0.0.1:3000";
var timeout = 60000;
var projectsInfo;
var projectUuid;
var version = 1

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
    .timeout(timeout)
    .send({
      username: username,
      password: password,
    })
    .end((err, res) => {
      if (res.status != 200) {
        alert('[Error ' + res.status + '] Authendication error');
      } else {
        fillDropDown(res);
      }
    })).body;
}

function fillDropDown(res) {
  
  var getProjects = (agent
    .get(url + '/api/projects')
    .query({
      filter: 'all',
      components: true
    })
    .timeout(timeout)
    .then(res => {
      var select = document.getElementById("projects");
      var options = res.body.projects;
      projectsInfo = res.body.projects;

      for (var i = 0; i < options.length; i++) {
        var opt = options[i].name;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
      }
    }));

    alert('Please select project to upload images.');
}

// Create a CSIneterface instance
var csInterface = new CSInterface();
var openButton = document.querySelector("#analyze");
openButton.addEventListener("click", analyzeImage);

function analyzeImage() {
    csInterface.evalScript("bootstrap()", function (result) {
      uploadToServer(result);
    });
}

// This function is responsible to upload all the created images to the server
function uploadToServer(dirPath) {
  var projectName = document.getElementById("projects").value;
  if (projectName == "") {
    alert('No project was selected for uploading or user was not authendicated.');
  } else {
    dirSearch.dirDFS(dirPath, function (err, data) {
      if (err) {
        throw err;
      }

      // Find the project that is currently selected and get its uuid
      for (var i = 0; i < projectsInfo.length; ++i) {
        if(projectsInfo[i].name == projectName) {
          projectUuid = projectsInfo[i].uuid;
        }
      }

      // Create project asset under the project and then uploading them
      data.forEach(function(entry) {
        fileNameWithExtensions = entry.split("\\");
        fileNameOnly = fileNameWithExtensions[fileNameWithExtensions.length - 1].split(".");

        // API that creates project assets
        // var projectBucket = (agent
        //   .post(url + '/api/projects/' + projectUuid + '/buckets')
        //   .timeout(timeout)
        //   .send({
        //     //name: fileNameOnly[0],
        //     //description: fileNameOnly[0]
        //   })
        //   .then(res => {
            //var bucketUUid = res.body.Uuid;
            var projectAsset = (agent
              .post(url + '/api/projects/' + projectUuid + '/assets')
              .timeout(timeout)
              .send({   
                name: fileNameOnly[0],
                description: fileNameOnly[0],
                //bucketUuid: bucketUUid
            })
            .then(res => {
              var assetUuid = res.body.uuid;
              var uploadFileToAsset = (agent
                .post(url + '/api/projects/' + projectUuid + '/assets/' + assetUuid + '/file')
                .timeout(timeout)
                .attach(fileNameWithExtensions[fileNameWithExtensions.length - 1], entry)
                .field('version', '0')
                .then(res => {
                  var test = res.body;
                  fs.unlink(entry, function (err) {
                    if (err) alert('[Error File Delete] ' + err.message);
                }); 
                })
                .catch(err => {
                  alert('Error in uploading: ' + err.message);
                }));
            })
            .catch(err => {
              alert('Error in creating assets: ' + err.message);
            }));
      //    }));
      });
      
      alert('Files uploaded as assets in project' + projectName);   
    });
  }
}