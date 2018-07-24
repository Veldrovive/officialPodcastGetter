const Nexmo = require('nexmo');
const rp = require('request-promise');

const nexmo = new Nexmo({
    apiKey: "KEY",
    apiSecret: "SECRET"
});

const googleKey = "KEY";

main();

function main(){
    var interval;
    start();

    function checkAndSend() {
        var currentDate = new Date();
        var startDate = new Date();
        startDate.setHours(20);
        startDate.setMinutes(0);
        startDate.setSeconds(0);
        startDate.setMilliseconds(0);
        const timeDiff = currentDate.getTime() - startDate.getTime();
        if(timeDiff < 0 || timeDiff > 7200000 || currentDate.getDay() !== 4){
            clearInterval(interval);
            console.log("Not correct time, waiting "+millisToThurs());
            setTimeout(start, millisToThurs())
        }

        getVideos("UCq6VFHwMzcMXbuKyG7SQYIg")
            .then(function (res) {
                res = JSON.parse(res);
                const lastCast = checkForOfficial(res);
                if (lastCast !== false) {
                    if (lastCast.hoursSince === 0) {
                        sendText(lastCast.timeSince, lastCast.name);
                        clearInterval(interval);
                        setTimeout(start, millisToThurs())
                    }
                    console.log("Old Podcast Detected")
                } else {
                    console.log("No Podcast Detected")
                }
            });
    }

    function millisToThurs(){
        var d = new Date();
        d.setDate(d.getDate() + (4 + 7 - d.getDay()) % 7);
        d.setHours(20);
        d.setMinutes(1);
        d.setSeconds(0);
        d.setMilliseconds(0);
        var today = new Date();
        return (d.getTime() - today.getTime());
    }

    function start() {
        interval = setInterval(checkAndSend, 1000 * 60)
    }
}

function sendText(timeSince, name){
    nexmo.message.sendSms(
        "NUMBER1", "NUMBER2", name + " Released "+timeSince+" Ago, Probably Beat You To It", function(err, res){
            if(err){
                console.log(err);
            }
            console.log("Response: ", res)
        }
    );
}

function checkForOfficial(videos){
    videos = videos.items;
    var lastPodcast = {
        timeSince: '',
        timeSinceMilli: 0,
        hoursSince: 0,
        name: '',
    };
    for(var i = 0; i < videos.length; i++){
        var currentVideo = videos[i].snippet;
        if(currentVideo.title.includes("Official Podcast")){
            const uploadDate = new Date(currentVideo.publishedAt);
            const currentDate = new Date();
            const timeSinceUp = currentDate.getTime() - uploadDate.getTime();
            const hoursSince = Math.floor(timeSinceUp/(1000*60*60))
            const minutesSince = Math.floor((timeSinceUp-hoursSince*3600000)/(1000*60));
            const secondsSince = Math.floor((timeSinceUp-hoursSince*3600000-minutesSince*60000)/1000);

            console.log(currentVideo.title+" is an Official Podcast Uploaded " + hoursSince + " Hours, "+ minutesSince +" Minutes, " + secondsSince + " Seconds Ago");
            lastPodcast.timeSince = hoursSince + " Hours, "+ minutesSince +" Minutes, " + secondsSince + " Seconds";
            lastPodcast.timeSinceMilli = timeSinceUp;
            lastPodcast.name = currentVideo.title;
            lastPodcast.hoursSince = hoursSince;
        }else{
            const uploadDate = new Date(currentVideo.publishedAt);
            const currentDate = new Date();
            const timeSinceUp = currentDate.getTime() - uploadDate.getTime();
            const hoursSince = Math.floor(timeSinceUp/(1000*60*60))
            const minutesSince = Math.floor((timeSinceUp-hoursSince*3600000)/(1000*60));
            const secondsSince = Math.floor((timeSinceUp-hoursSince*3600000-minutesSince*60000)/1000);

            console.log(currentVideo.title+" is not an Official Podcast Uploaded " + hoursSince + " Hours, "+ minutesSince +" Minutes, " + secondsSince + " Seconds Ago");
        }
    }
    if(lastPodcast.timeSinceMilli > 0){
        return lastPodcast;
    }else{
        return false;
    }
}

function getVideos(id){
    return new Promise(function(resolve, reject){
        rp({url: "https://www.googleapis.com/youtube/v3/activities?part=snippet&maxResults=4&channelId="+id+"&key="+googleKey})
            .then(function(res){
                resolve(res)
            })
    });
}
