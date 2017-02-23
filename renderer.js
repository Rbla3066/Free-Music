const fs = require('fs');
const path = require('path');
const request = require('request');
const open = require('open');
const ffmetadata = require("ffmetadata");
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const ID3Writer = require('browser-id3-writer');


$(document).ready(function(){

    var trackIn = $("#trackInput")
  trackIn.focus();

  trackIn.on('focus', function(e){
      var target = 0;
   $(window).keyup(function(e) {
       console.log(e.keyCode);

       var val = trackIn.val();
       if (e.keyCode == 40) {
           console.log(target);
           if (target > 4) return;
           target++;
           $('.typeItem.active').removeClass('active');
           $('#dropDown' + target).addClass('active');
       } else if (e.keyCode == 38) {
           trackIn.val("").val(val);
           if (target == 0){
               $('.typeItem.active').removeClass('active');
               return;
           }
           target--;
           $('.typeItem.active').removeClass('active');
           if (target > 0) $('#dropDown' + target).addClass('active');
       } else if (e.keyCode == 13) {
           return;
       } else if (val.length > 1) {
           $('.typeAhead').remove();
           var context = trackIn.val();
           request('https://api.spotify.com/v1/search?q=' + encodeURIComponent(val.replace(/[\-\\\/!*?<>|\^]/g, ' ')) + '*&type=artist,track', function (err, response) {
               if(trackIn.val() != context) return;
               var data = JSON.parse(response.body);
               if (err) return console.log(err);
               var artists = data.artists.items.slice(0, 5);
               var tracks = data.tracks.items.slice(0, 5);
               var list = artists.concat(tracks);
               console.log(list);
               list.concat(data.tracks.items.slice(0, 5));
               list.sort(function (a, b) {
                   var pop = a.popularity,
                       pop2 = b.popularity;

                   if (pop < pop2) return 1;
                   if (pop > pop2) return -1;
                   return 0;
               })
               var popup = `<div class='typeAhead'>`
               for (var i = 1; i <= 5 && i < list.length; i++) {
                   var item;
                   list[i].type == 'artist' ? item = list[i].name : item = list[i].artists[0].name + ' - ' + list[i].name;
                   popup += '<div class="typeItem" id="dropDown' + i + '">' + item + '</div>';
               }
               popup += '</div>';
               target = 0;
               $('.typeAhead').remove();
               $('body').append(popup);
           })
       } else {
           $('.typeAhead').remove();
       }
   });
  });
    trackIn.on('focusout', function(){
        $(window).keyup(() => {});
        $('.typeAhead').remove();
    })


    function searchQuery(query){

        $('.typeAhead').remove();
        $("#copyright").remove();
        $(".results").html("");
        trackIn.val("")
        $(".results").html(`
        <div id="loadingGif" style="width: 100%; margin-top: 50px;">
          <div style="width: 201px; margin: auto; opacity: 0.3;">
            <img src="loading.gif" class="img-responsive" />
          </div>
        </div>
      `)



        request('https://www.googleapis.com/youtube/v3/search?q='+query+'&part=snippet&maxResults=50&topicId=/m/04rlf&type=video&key=AIzaSyDQX7BTPgUldYCJeRAuwTgFiGD9uH-I-LA', function(err, data){
            if(err) return console.log(err);
            var songs = JSON.parse(data.body).items;
            console.log(songs)
            var songList = [];
            for(let i in songs){
                var name = songs[i].snippet.title.split('-');
                if(name.length > 1) {
                    var song = {
                        title: songs[i].snippet.title,
                        id: songs[i].id.videoId,
                        img: songs[i].snippet.thumbnails.default.url
                    }
                    songList.push(song);
                }
            }
            data = songList
            console.log(data)
            $("#loadingGif").fadeOut(500, function(){
                if(!data || !data.length || data.length == 0) return $(".results").html("<h3 style='text-align: center'>..No results<h3>");
                $(".results").html("<div id='resultPanel' style='display: none'></div>")
                for(i in data){
                    $("#resultPanel").append(`<div class='resultTab'>
 	   	    <span data-id='`+data[i].id+`' data-title='`+data[i].title+`' data-toggle='modal'
 	   	     data-target='#myModal' class='glyphicon glyphicon-download icon-right'></span>
 	   	    `+data[i].title+`
 	   	    </div>`)
                }
                $('.typeAhead').remove();
                $('#resultPanel').fadeIn(500)
            })

        });
        return false;
    }
  $("#search").click(function(e){
      e.preventDefault();
      var active = $('.typeItem.active');
      active && active.text() != '' ? searchQuery(active.text()) : searchQuery(trackIn.val());
      return false;
  });


  $("body").on("click", ".icon-right", function(){
    var track = $(this).data('title').split("-");
    var artist = track[0] ? track[0].trim() : "";
    var title = track[1] ? track[1].trim() : "";
    var img = "https://i.ytimg.com/vi/"+$(this).data('id')+"/hqdefault.jpg";


    $("#artistInput").val(artist)
    $("#trackInput2").val(title)
    $("#submit2").attr("data-idtarget", $(this).data('id'))
    $("#inputImg").attr("src", img)

  })

  
  $("#submit2").click(function(){


    $('#progressModal').modal({
      backdrop: 'static',
      keyboard: false
    });



	var id = $(this).attr('data-idtarget'),
	    artist = safe($('#artistInput').val()),
	    title = safe($('#trackInput2').val()),
	    album = safe($('#albumInput').val()),
	    track = artist + ' - ' + title + '.mp3',
	    image = 'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
	
	
	process.env['PATH'] = '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
	//Configure YoutubeMp3Downloader with your settings 
	var YD = new YoutubeMp3Downloader({
	    "ffmpegPath": path.join(__dirname + "/ffmpeg"),        // Where is the FFmpeg binary located? 
	    "outputPath": path.join(__dirname + "/Music"),                // Where should the downloaded and encoded files be stored? 
	    "youtubeVideoQuality": "highest",       // What video quality should be used? 
	    "queueParallelism": 2,                  // How many parallel downloads/encodes should be started? 
	    "progressTimeout": 2000                 // How long should be the interval of the progress reports 
	});
	 
	//Download video and save as MP3 file 
	YD.download(id, track);
	
	YD.on("finished", function(data) {
	  var songInfo = { artist, title, album, image, track }
		
	  var download = function(uri, filename, callback){
	    request.head(image, function(err, res, body){
	      console.log('content-type:', res.headers['content-type']);
	      console.log('content-length:', res.headers['content-length']);
	  
	      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
	    });
	  };

	  download(image, path.join(__dirname + '/google.jpg'), function(){
 		 console.log('done');
 		 const songBuffer = fs.readFileSync(path.join(__dirname + '/Music/' + track));
		 const coverBuffer = fs.readFileSync(path.join(__dirname, 'google.jpg'));
		 const writer = new ID3Writer(songBuffer);
		 writer.setFrame('TIT2', $('#trackInput2').val())
		 	.setFrame('TPE1', [$('#artistInput').val()])
		 	.setFrame('TALB', $('#albumInput').val())
		 	.setFrame('APIC', {
		 		type: 3,
		 		data: coverBuffer,
		 		description: 'Band Photo'
		 	})
		 writer.addTag();
		 const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
		 fs.writeFileSync(path.join(__dirname + '/Music/' + track) , taggedSongBuffer);
		 open(path.join(__dirname + ('/Music/' + track)))
		 $("#downProgress").attr("aria-valuenow", "0").attr("style", "width: 0%;").text('0%');
	  	 $("#progressModal").modal("hide");
		})  
	
	});
	 
	YD.on("error", function(error) {
	    $("#downProgress").modal("hide")
	    $(".results").html("<h3>"+error+"</h3>")
	});
	 
	YD.on("progress", function(progressO) {
	  console.log(progressO)
	  $('#downProgress').show()
	  var progress = parseInt(progressO.progress.percentage)
	  $('#downProgress').css('width', progress +'%').attr('aria-valuenow', progress).text(progress + '%');
	})

  })
})

$('.jumbotron').slideToggle()

function safe(string){
    return string.replace(/[\\/!?*<>]/g, '').replace(/\$/g, 'S');
}

setTimeout(function(){
  $('.container-fluid').fadeIn(2000)
  $('#loadingScreen').fadeOut(1000, function(){
    $("#mainLogo").fadeIn(1000)
    $('.jumbotron').slideToggle(1000)
    $('.main-content').fadeIn(500)
  })
  
}, 3000);
 





