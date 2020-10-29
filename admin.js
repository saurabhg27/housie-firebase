console.log("LOADED MY>JS");
console.log("LOADED");
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAHId-jypih_eetC9RQWPFTlpdBm0zXO_Y",
    authDomain: "housie-e5c32.firebaseapp.com",
    databaseURL: "https://housie-e5c32.firebaseio.com",
    projectId: "housie-e5c32",
    appId: "1:870540156533:web:8b39f85f7628329072623c"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();
//No redirect URL has been found. You must either specify a signInSuccessUrl in the configuration, pass in a redirect URL to the widget URL, or return false from the callback.
var fbauth = firebase.auth();

$(document).ready(function () {
    console.log("doc ready")

    fbauth.onAuthStateChanged(function (user) {
        document.getElementById('loadingdiv').style.display = 'none';
        if (user) {
            //console.log(user);
            document.getElementById('adminpage').style.display = 'block';
            $('#loginuserdetails').html("Logged in user: " + user.displayName + "(" + user.email + ")");
            renderAdminTable();
        } else {
            console.log("no user logged in");
            document.getElementById('loginsection').style.display = 'block';
            var ui = new firebaseui.auth.AuthUI(fbauth);

            ui.start('#firebaseui-auth-container', {
                signInOptions: [
                    // List of OAuth providers supported.
                    firebase.auth.GoogleAuthProvider.PROVIDER_ID
                ],
                callbacks: {
                    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                        // User successfully signed in.
                        // Return type determines whether we continue the redirect automatically
                        // or whether we leave that to developer to handle.
                        document.getElementById('adminpage').style.display = 'block';
                        return false;
                    }
                }
                // Other config options...
            });
        }
    });

    $("#generateBut").click(function () {

        console.log("Generate CLICKED");
        var numberIpVal = $("#numberInput").val();
        sendGenerateReq(numberIpVal);


    });

    $("#autoGenerateButton").click(function () {
        sendAutoGenerateRequest();
    });

    $("#resetBoard").click(function () {
        if (window.confirm("Reset Board??") && window.confirm("Sure??")) {
            var fbboarddoc = db.collection("stuff").doc("board");
            var jsonBoar = {}
            for (var i = 1; i <= 90; i++) {
                jsonBoar[i] = "false"
            }
            var jsonboarStr = JSON.stringify(jsonBoar);

            fbboarddoc.update({
                boardjson: jsonboarStr,
                lastfew: "[]",
                boardmessage: "",
            }).then(function () {
                console.log("reset board successfully updated!");
                $("#generateStatus").html("reset board done ");
            }).catch(function (error) {
                console.error("reset board Error updating document: ", error);
                $("#generateStatus").html("error while reset board");
            });
        }


    });

    $("#delNumBut").click(function () {
        var toBeDelNumber = prompt("Enter number to be deleted");
        deletenumber(toBeDelNumber)
    });



    $("#showMsgBut").click(function () {
        var mess = prompt("Enter Message");
        var fbboarddoc = db.collection("stuff").doc("board");
        fbboarddoc.update({
            boardmessage: mess
        }).then(function () {
            console.log("message successfully updated!");
            $("#generateStatus").html("message set successfully");
        }).catch(function (error) {
            console.error("rmessage Error updating document: ", error);
            $("#generateStatus").html("error while message");
        });

    });


    $("#adTabTog").click(function () {
        $("#numberTable").toggle();
    });

    $("#adTabRef").click(function () {
        setAdminTableStatus();
    });



});

function sendAutoGenerateRequest() {
    //console.log("sendAutoGenerateRequest");

    var fbboarddoc = db.collection("stuff").doc("board");
    var board = fbboarddoc.get().then(function (doc) {
        var mapJson = JSON.parse(doc.data().boardjson);
        //console.log(" document data:", mapJson, mapJson[nm]);

        var leftlist = [];
        for (var key in mapJson) {
            if (mapJson.hasOwnProperty(key)) {
                var val = mapJson[key];

                if (val == "false") {
                    leftlist.push(key)
                }
            }
        }
        if (leftlist.length == 0) {
            $("#generateStatus").html("No numbers left!");
        } else {
            //console.log("leftlist", leftlist)
            const random = Math.floor(Math.random() * leftlist.length);
            var autogennumber = leftlist[random]
            console.log("autogen: ", autogennumber);
            //TODO try to use consumers or something here
            sendGenerateReq(autogennumber)
        }


    }).catch(function (error) {
        console.log("Error getting cached document:", error);
        $("#generateStatus").html("error while adding: " + nm);
    });

}

function setAdminTableStatus() {

    var fbboarddoc = db.collection("stuff").doc("board");
    var board = fbboarddoc.get().then(function (doc) {
        var mapJson = JSON.parse(doc.data().boardjson);
        for (var key in mapJson) {
            var val = mapJson[key];
            if (val == "true") {
                $('#adBut' + key).prop('disabled', true);

            }
            if (val == "false") {
                $('#adBut' + key).prop('disabled', false);
            }
        }


    }).catch(function (error) {
        console.log("error while admin table refresh:", error);
        $("#generateStatus").html("error while admin table refresh ");
    });


}
function renderAdminTable() {

    for (var i = 0; i < 9; i++) {
        var rowStr = "<tr>";
        for (var j = 1; j <= 10; j++) {

            var number = i * 10 + j;
            rowStr = rowStr + "<td><button id='adBut" + number + "' class='tableNumButton' >" + number + "</button></td>";
        }
        rowStr = rowStr + "</tr>";
        $('#numberTable tr:last').after(rowStr);

    }
    setAdminTableStatus();
    $('.tableNumButton').click(function () {
        var number = $(this).html();
        console.log("table number clicked: ", number);
        sendGenerateReq(number);
        $(this).prop('disabled', true);
    });
}
function deletenumber(nm) {
    $("#generateStatus").html("Trying to delete:" + nm);
    var fbboarddoc = db.collection("stuff").doc("board");
    var board = fbboarddoc.get().then(function (doc) {
        var mapJson = JSON.parse(doc.data().boardjson);
        var lastfewlist = JSON.parse(doc.data().lastfew)
        //console.log(" document data:", mapJson, mapJson[nm]);

        mapJson[nm] = "false";
        lastfewlist = lastfewlist.filter(function (e) { return e !== nm })
        var jsonboarStr = JSON.stringify(mapJson);
        var lastfewlistStr = JSON.stringify(lastfewlist);
        fbboarddoc.update({
            boardjson: jsonboarStr,
            lastfew: lastfewlistStr
        }).then(function () {
            $("#generateStatus").html("deleted number: " + nm);
        }).catch(function (error) {
            console.error("Error updating document: ", error);
            $("#generateStatus").html("error while delete: " + nm);
        });


    }).catch(function (error) {
        console.log("Error delete:", error);
        $("#generateStatus").html("error while delete: " + nm);
    });
}

function sendGenerateReq(nm) {
    //console.log(nm);
    $("#generateStatus").html("Trying to add:" + nm);
    var fbboarddoc = db.collection("stuff").doc("board");
    fbboarddoc.get().then(function (doc) {
        var mapJson = JSON.parse(doc.data().boardjson)
        var lastfewlist = JSON.parse(doc.data().lastfew)
        //console.log(" document data:", mapJson, mapJson[nm]);
        if (mapJson[nm] == "false") {
            mapJson[nm] = "true";
            lastfewlist.push(nm);
            var jsonboarStr = JSON.stringify(mapJson);
            var lastfewlistStr = JSON.stringify(lastfewlist)
            fbboarddoc.update({
                boardjson: jsonboarStr,
                lastfew: lastfewlistStr
            }).then(function () {
                $("#generateStatus").html("added number: " + nm);
            }).catch(function (error) {
                console.error("Error updating document: ", error);
                $("#generateStatus").html("error while adding: " + nm);
            });
        } else {
            $("#generateStatus").html("already added: " + nm);
        }


    }).catch(function (error) {
        console.log("Error getting cached document:", error);
        $("#generateStatus").html("error while adding: " + nm);
    });


}