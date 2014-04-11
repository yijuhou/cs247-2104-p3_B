// Initial code by Borui Wang, updated by Graham Roth
// For CS247, Spring 2014

(function() {

  var cur_video_blob = null;
  var fb_instance;
  var mediaRecorder;
  var filter_class = "none";
  var username_cp;
  var response_index = 0;
  var is_response = false;
  var is_repliable = false;
  var response_id;

  $(document).ready(function(){
    connect_to_chat_firebase();
    connect_webcam();
  });

  function connect_to_chat_firebase(){
    /* Include your Firebase link here!*/
    fb_instance = new Firebase("https://gsroth-p3-v1.firebaseio.com");

    // generate new chatroom id or use existing id
    var url_segments = document.location.href.split("/#");
    if(url_segments[1]){
      fb_chat_room_id = url_segments[1];
    }else{
      fb_chat_room_id = Math.random().toString(36).substring(7);
    }
    display_msg({m:"Share this url with your friend to join this chat: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

    // set up variables to access firebase data structure
     fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
     fb_instance_users = fb_new_chat_room.child('users');
     fb_instance_stream = fb_new_chat_room.child('stream');
    my_color = "#"+((1<<24)*Math.random()|0).toString(16);

    // listen to events
    fb_instance_users.on("child_added",function(snapshot){
      display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
    });
    fb_instance_stream.on("child_added",function(snapshot){
      display_msg(snapshot.val());
    });

    // block until username is answered
    username = window.prompt("Welcome, warrior! please declare your name?");
    if(!username){
      username = "anonymous"+Math.floor(Math.random()*1111);
      username_cp = username;
    }
    fb_instance_users.push({ name: username,c: my_color});
    $("#waiting").remove();

    // bind submission box
    $("#submission input").keydown(function( event ) {
      if (event.which == 13) {
        /*if(has_emotions($(this).val())){
          fb_instance_stream.push({m:username+": " +$(this).val(), v:cur_video_blob, c: my_color});
        }else{
          fb_instance_stream.push({m:username+": " +$(this).val(), c: my_color});
        }*/
        fb_instance_stream.push({m:username+": " +$(this).val(), c: my_color});
        $(this).val("");
        scroll_to_bottom(0);
      }
    });

    //Match with RegExp
    // $("#submission input").keyup(function( event ) {
    //   var match = /:\)|:-\)|great|cool|yeah|:\(|:-\(|What!|What?|OMG|!!!/i;
    //   var send_button = document.getElementById("sendrep");
    //   if (match.test($(this).val())){
    //     send_button.disabled = false;
    //   }else{
    //     send_button.disabled = true;        
    //   }
    // });



    // scroll to bottom in case there is already content
    scroll_to_bottom(1300);
  }

  // creates a message node and appends it to the conversation
  function display_msg(data){
    if(data.m) $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"</div>");
    if(data.v){


      // for video element
      var wrapper = document.createElement("div");
      var video = document.createElement("video");
      video.autoplay = true;
      video.controls = false; // optional
      video.loop = true;
      video.width = 120;
      video.className = filter_class;

      var source = document.createElement("source");
      source.src =  URL.createObjectURL(base64_to_blob(data.v));
      source.type =  "video/webm";

      video.appendChild(source);

      if(data.response){
        var resid = data.rid;
        console.log(resid);
        var target_wrapper = document.getElementById(resid);
        target_wrapper.removeChild(target_wrapper.lastChild);
        target_wrapper.appendChild(video);
        return;
      }

      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
      // var video = document.createElement("img");
      // video.src = URL.createObjectURL(base64_to_blob(data.v));

      document.getElementById("conversation").appendChild(wrapper);
      wrapper.appendChild(video);

      if(data.r){
        wrapper.id = "wrapper" + response_index;
        is_response = true;
        var response = document.createElement("button");
        response.setAttribute("type", "button");
        response.innerHTML = "Click to record a response video!";
        var obj = response;
        response.onclick = function(event){
          response_id = obj.parentNode.id;
          mediaRecorder.start(1000);
        };
        wrapper.appendChild(response);
        response_index += 1;
      }
    }
  }

  function scroll_to_bottom(wait_time){
    // scroll to bottom of div
    setTimeout(function(){
      $("html, body").animate({ scrollTop: $(document).height() }, 200);
    },wait_time);
  }

  function connect_webcam(){
    // we're only recording video, not audio
    var mediaConstraints = {
      video: true,
      audio: false
    };

    // callback for when we get video stream from user.
    var onMediaSuccess = function(stream) {
      // create video element, attach webcam stream to video element
      var video_width= 160;
      var video_height= 120;
      var webcam_stream = document.getElementById('webcam_stream');
      var video = document.createElement('video');
      webcam_stream.innerHTML = "";
      // adds these properties to the video
      video = mergeProps(video, {
          controls: false,
          width: video_width,
          height: video_height,
          src: URL.createObjectURL(stream)
      });
      video.play();
      webcam_stream.appendChild(video);

      // counter
      var time = 0;
      var second_counter = document.getElementById('second_counter');
      var second_counter_update = setInterval(function(){
        second_counter.innerHTML = time++;
      },1000);

      // now record stream in 5 seconds interval
      var video_container = document.getElementById('video_container');
      mediaRecorder = new MediaStreamRecorder(stream);
      var index = 1;

      mediaRecorder.mimeType = 'video/webm';
      // mediaRecorder.mimeType = 'image/gif';
      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
      mediaRecorder.video_width = video_width/2;
      mediaRecorder.video_height = video_height/2;

      //emoji table
      var smiley = document.getElementById("smiley");
      smiley.onclick = function(event) {
        $("#submission input").val($("#submission input").val() + ":)"); 
      };

      var smiley_nose = document.getElementById("smiley_nose");
      smiley_nose.onclick = function(event) {
        $("#submission input").val($("#submission input").val() + ":-)"); 
      };

      var sad = document.getElementById("sad");
      sad.onclick = function(event) {
        $("#submission input").val($("#submission input").val() + ":("); 
      };

      var sad = document.getElementById("sad_nose");
      sad_nose.onclick = function(event) {
        $("#submission input").val($("#submission input").val() + ":-("); 
      };

      var send_repliable = document.getElementById("sendrep");
      // send_repliable.setAttribute("type", "button");
      // send_repliable.innerHTML = "Send Repliable Video!"
      //send_repliable.disabled = true;
      //send_repliable.id = "sendrep";
      send_repliable.onclick = function(event) {
        is_response = false;
        mediaRecorder.start(1000);
        fb_instance_stream.push({m:username+": " +$("#submission input").val(), c: my_color});
        $("#submission input").val("");
        scroll_to_bottom(0);
      };
      document.getElementById('sendrep_td').appendChild(send_repliable);


      mediaRecorder.ondataavailable = function (blob) {
          //console.log("new data available!");
          video_container.innerHTML = "";

          // convert data into base 64 blocks
          blob_to_base64(blob,function(b64_data){
            cur_video_blob = b64_data;
            if(is_response){
              is_response = false;
              //console.log(response_id);
              fb_instance_stream.push({v:cur_video_blob, response:true, rid:response_id});
              return;
            }
            fb_instance_stream.push({v:cur_video_blob, r: true});
          });
      };
      /*setInterval( function() {
        mediaRecorder.stop();
        mediaRecorder.start(3000);
      }, 3000 );*/
      console.log("connect to media stream!");
    }

    // callback if there is an error when we try and get the video stream
    var onMediaError = function(e) {
      console.error('media error', e);
    }

    // get video stream from user. see https://github.com/streamproc/MediaStreamRecorder
    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  }

  // check to see if a message qualifies to be replaced with video.
  var has_emotions = function(msg){
    //var options = ["lol",":)",":("];
    var match = /:\)|:-\)|great|cool|yeah|:\(|:-\(|What!|What?|OMG|!!!/i;
    /*for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;*/
    return match.test(msg);
  }


  // some handy methods for converting blob to base 64 and vice versa
  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
  // note useing String.fromCharCode.apply can cause callstack error
  var blob_to_base64 = function(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  var base64_to_blob = function(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([view]);
    return blob;
  };

})();
