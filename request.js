
var session_id = "";

function SendRequest(description = '', paramObj = {}, filename="do.php") {
    // The promise isn't resolved until the server responds!
    //console.log("send request");
    var params = 'session_id=' + session_id + '&';

    if (paramObj instanceof Parameters) { // if paramObj is fine
        params += paramObj.encode;
    }
    else if (Object.entries(paramObj).length !== 0) // check if paramObjList is OK
    {
        temp_paramObj = new Parameters(paramObj);
        params += temp_paramObj.encode;

    } else {
        throw "SendRequest: Bad Parameters provided";
    }

    return new Promise(function (resolve, reject) { // resolve and reject are both functions

        var request = new XMLHttpRequest();
        request.open('POST', filename, true);
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        request.onload = function () {
            //onreadystatechange
            //xmlHttp.readyState == 4 && xmlHttp.status == 200
            if (request.status === 200) {
                resolve(request.response);
            } else {
                reject(JSON.parse(request.response)["db_lastErrorMessage"]); // Error 'Failure in: ' + description + '. ' + request.statusText));
            }
        };

        request.onerror = function () {

            reject(Error('There was a network error.'));
        };

        request.send(params);
    });
}

function new_session(input_title, input_description) {
    var d = new Date();

    
    SendRequest("Create new session", new Parameters({  action:8, title:input_title, 
                                                        creation_date:d.toISOString(), 
                                                        description:input_description}),
                                                        "session.php")
                                                        .then(function (response) {
        // get new UUID
        window.location.href = window.location.href.split('?')[0] + '?id=' + response;
    }, function (Error) {
        alert("Failed to create new UUID");
        console.log(Error);
    }
    );
}

class Parameters {

    action;
    event_ID;
    dateStart;
    dateEnd;
    title;
    description;
    color;
    type_Name;
    time;
    session_id;
    creation_date;
    todo;

    constructor(obj = {}) {
        for (var key in obj) {
            if (!this.hasOwnProperty(key)) {
                throw `Invalid parameter "${key}" passed`;
            } else {
                this[key] = obj[key];
            }
        }

    }
    get encode() { // encodes the parameters like -> action=4&dateStart=now&dateEnd=now+2&title=st%C3%A5le&description=Describeme!
        let params = '';
        for (var key in this) { //Object.getOwnPropertyNames(
            if (typeof this[key] !== 'undefined' && typeof this[key] !== 'function') {
                if (params != '') {
                    params += '&';
                }
                params += `${key}=${encodeURIComponent(this[key])}`;
            }
        }
        return params;
    }
}
