const request = require('superagent');
const dirSearch = require('C:/Program Files (x86)/Common Files/Adobe/CEP/extensions/my_first_extension/client/dirSearch/dirDFS.js');
const fs = require('fs');
const path = require('path');
var zipFolder = require('zip-folder');
const agent = request.agent();
const url = "http://127.0.0.1:3000";
const timeout = 60000;
var projectsInfo;
var projectUuid;
var version = '0';

function validate() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  if (username == "" || password == "") {
    alert('Error: Username or password was not provided');
    return false;
  }
  
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
      if (err) {
        alert('[Error] ' + err);
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
    })).body;

    alert('Please select project to upload images.');
}

// Create a CSIneterface instance
var csInterface = new CSInterface();
var openButton = document.querySelector("#analyze");
openButton.addEventListener("click", analyzeImage);

function analyzeImage() {
    csInterface.evalScript("bootstrap()", function (result) {
      //uploadToServer(result);
      uploadZipFile(result);
    });
}

// Function to upload zip file on server
function uploadZipFile(dirPath) {
  var projectName = document.getElementById("projects").value;
  // Find the project that is currently selected and get its uuid
  for (var i = 0; i < projectsInfo.length; ++i) {
    if(projectsInfo[i].name == projectName) {
      projectUuid = projectsInfo[i].uuid;
    }
  }

  if (projectName == "") {
    alert('No project was selected for uploading or user was not authendicated.');
  } else {
  var zipFile = dirPath + '.zip'
  zipFolder(dirPath, zipFile, function(err) {
    if (err) {
      alert('[Error in zipping] ' + err);
      return ;
    } else {
      var createZipAsset = (agent
        .post(url + '/api/projects/' + projectUuid + '/assets')
        .timeout(timeout)
        .query({
          version: version
        })
        .send({
          name: zipFile,
          description: 'photoshop'
        })
        .then(asset => {
          alert('Asseet ' + asset.body.uuid + ' was created');
          agent
            .post(url + '/api/projects/' + projectUuid + '/assets/' + asset.body.uuid + '/file')
            .timeout(timeout)
            .attach('photoshop.zip', zipFile)
            .field(version, version)
            .then(res => {
              alert('Uploaded!!!');
            }).body;
        })).body;
    }
  })
}
}

// This function is responsible to upload all the created images to the server
function uploadToServer(dirPath) {

  // Get saved assets exported from Photoshop extension
  var dataPath = "C:/Users/acc/Downloads/layers_bounding_box.txt";
  var content=fs.readFileSync(dataPath, "utf8");
  fs.unlink(dataPath, function (err) {
    if (err) alert('[Error File Delete] ' + err.message);
  });

  // Making some magic to make a proper JSON string
  content = content.toString();
  content = content.replace(/,(?=[^,]*$)/,'');
  var elementMap = JSON.parse(content);

  // Replace white spaces and special symbols all the data read from the file
  for (var key in elementMap) {
    if (elementMap.hasOwnProperty(key)) {
     var val = elementMap[key],       
      firstRound = key.replace(/\s+/g, '_');
      finalRound = firstRound.replace(/[&\/\\#,!+()$~%.'":*?<>{}]/g,'');
      delete elementMap[key];
      elementMap[finalRound] = val;
    }
  }

  var projectName = document.getElementById("projects").value;
  // Find the project that is currently selected and get its uuid
  for (var i = 0; i < projectsInfo.length; ++i) {
    if(projectsInfo[i].name == projectName) {
      projectUuid = projectsInfo[i].uuid;
    }
  }

  if (projectName == "") {
    alert('No project was selected for uploading or user was not authendicated.');
  } else {
    dirSearch.dirDFS(dirPath, function (err, data) {
      if (err) {
        throw err;
      }

      // Create project asset under the project and then uploading them
      data.forEach(function(entry) {
        fileNameWithExtensions = entry.split("\\");
        fileNameOnly = fileNameWithExtensions[fileNameWithExtensions.length - 1].split(".");
        fileNameNoExt = fileNameOnly[0];

        // Apply similar magic as we did before for the assets's file
        fileNameNoExt = fileNameNoExt.replace(/\s+/g, '_');
        fileNameNoExt = fileNameNoExt.replace(/[&\/\\#,!+()$~%.'":*?<>{}]/g,'');

        // File info in array [name, x1, y1, x2, y2]
        if (elementMap.hasOwnProperty(fileNameNoExt)) {
          var boundingBoxInfo  = {
            x1: elementMap[fileNameNoExt][0],
            y1: elementMap[fileNameNoExt][1],
            x2: elementMap[fileNameNoExt][2],
            y2: elementMap[fileNameNoExt][3]
          };
        }
        
        var projectAsset = (agent
              .post(url + '/api/projects/' + projectUuid + '/assets')
              .timeout(timeout)
              .send({   
                name: fileNameOnly[0],
                description: fileNameOnly[0],
                bounds: boundingBoxInfo
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