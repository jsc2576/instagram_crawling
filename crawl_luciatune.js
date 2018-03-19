var https = require('https');
var fs = require('fs');
var du = require('date-utils');

var insta_url = 'https://www.instagram.com';
var insta_path = '/luciatune/?__a=1';
var insta_next = '';
var save_path = '/srv/dev-disk-by-id-ata-HGST_HTS541010A7E630_S0A000SSGD2SGK-part4/심규선/private_instagram/';

var dir_name;
var today;
var count;
var video_count;
var loop=0;
function Init(){

	var date = new Date();
//	console.log('today date: ', date);
	today = Date.today().addDays(-1);
	console.log('today: ', today);
	dir_name = save_path+'before_'+date.getFullYear()+(date.getMonth()+1)+(date.getDate()+1)+'/';
	fs.mkdir(dir_name, '0777', function(err){
		if(err){
			console.log('exist dir');
			return;
		}else console.log('make dir');
	});
	count = 0;
	video_count = 0;
}

function crawl(){
	loop++;
	console.log('start');
	var next_check = false;

	https.get(insta_url+insta_path+insta_next, function(res){
		var data_arr = [];
		var data_json;	
		res.on('data', function(data){
			data_arr.push(data);
		}).on('end', function(){
			data_arr = Buffer.concat(data_arr).toString();	
			data_json = JSON.parse(data_arr);

			insta_next = '&max_id='+data_json.user.media.page_info.end_cursor;
			
			var nodes = data_json.user.media.nodes;
			for(var i=0; i<nodes.length; i++){
				//이미지 날짜 계산
				var utcseconds = nodes[i].date; 
				var utcdate = new Date(0);
				utcdate.setUTCSeconds(utcseconds);
				console.log('utc date: ',utcdate);
				console.log(today, ": ", utcdate);	
					
//				if(Date.compare(today, utcdate) <= 0){	
					next_check = true;
					if(!nodes[i].is_video){
						console.log('download');
						 
						var thumbnail = nodes[i].display_src;
						download(thumbnail, count);
console.log('img count: ',count);
						count++;
					}
					else{
						video(nodes[i].code, video_count);
console.log('video count: ',count);
						video_count++;
					}
//				}
			}
//			if(next_check)	crawl();
			if(loop<100) crawl();
			else return;
		});
	});
};

function download(url, cnt){
	https.get(url, function(res){
		var res_buf = [];

		res.on('data', function(buf){
			res_buf.push(buf);
		}).on('end', function(){
			res_buf = Buffer.concat(res_buf);
			fs.writeFile(dir_name+cnt+'.jpg', res_buf, 'binary', function(err){
				if(err)
					console.log('error');
				else{
					console.log('success: ',cnt);
				}
			});
			
		});
	});

}

function video(code, cnt){
	var url = insta_url + '/p/' + code + '/?__a=1';
	console.log('url: '+url);
	https.get(url, function(res){
		var res_buf = [];
		
		res.on('data', function(buf){
			res_buf.push(buf);
		}).on('end', function(){
			res_buf = Buffer.concat(res_buf).toString();
			var res_json = JSON.parse(res_buf);
			download_video(res_json.graphql.shortcode_media.video_url, cnt);
		});
	});
}

function download_video(url, cnt){
	https.get(url, function(res){
		var res_buf = [];
		
		res.on('data', function(buf){
			res_buf.push(buf);
		}).on('end', function(){
			res_buf = Buffer.concat(res_buf);
			fs.writeFile(dir_name+'video_'+cnt+'.mp4', res_buf, 'binary', function(err){
				if(err)	console.log('video error');
				else	console.log('video success', cnt);
			});
		});
	});
}
Init();
crawl();
/*
setInterval(function(){
	Init();
	crawl();
}, 86400000);
*/
