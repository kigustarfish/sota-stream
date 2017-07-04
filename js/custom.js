var imageCache = {};

$(function() {
	doPoll()
})
function doPoll(){
    $.post('/chat', function(data) {
        processData(JSON.parse(data));
        setTimeout(doPoll,1000);
    });
}


function processData(data) {
	$("#message-list").empty();
	data = data.reverse();
	var index = 0;
	for (datum in data) {
		var item = data[datum];
                var val = item.value;
                if (item.type == "myKills" || item.type == "localKills"  || item.type =="myDeaths") {
			val = killString(val);
		}
                if (item.type == "selfCombat" ) {
			val = attackString(val);
		}
		//$("<li class='"+item.type+"'>").text(val);
		var element = $("<li id='message"+index+"' class='"+item.type+"'>").html(val);
		$("#message-list").prepend(element);
		index++;
		if (!elementInViewport("message-list")) {
			element.hide();
			break;
		}
		
	}
	$("#message-list li").each(function(){$(this).kappa();});
}

function elementInViewport(el) {

	  el = document.getElementById(el);
	  var top = el.offsetTop;
	  var left = el.offsetLeft;
	  var width = el.offsetWidth;
	  var height = el.offsetHeight;

	  while(el.offsetParent) {
		      el = el.offsetParent;
		      top += el.offsetTop;
		      left += el.offsetLeft;
		    }

	  return (
		      top >= window.pageYOffset &&
		      left >= window.pageXOffset &&
		      (top + height) <= (window.pageYOffset + window.innerHeight) &&
		      (left + width) <= (window.pageXOffset + window.innerWidth)
		    );
	}





function attackString(data) {
	data_parts = data.split(" attacks ");
	attacker = data_parts[0];
	killer = attacker
        if (data_parts[1].indexOf("and hits")!= -1) {
            if (data_parts[1].indexOf("damage.")!= -1) {
		    damage = parseInt(data_parts[1].split("dealing")[1].split("points")[0]);
		    if (data_parts[1].indexOf("critical") != -1) {
			damage = "<span class=\"crit\">" + damage + "</span>";
		    } else {
			damage = damage;
		    }
		    killed = data_parts[1].split("and")[0];
		   return killer + " " + damage + " " + killed;
	    } else {
		    spell_parts = data_parts[1].split(" from ");
		    killed = data_parts[1].split("and")[0];
		    if (spell_parts.length < 2) return;
		    spell = spell_parts[1].replace(".","").trim();
		    damage = parseInt(data_parts[1].split("dealing")[1].split("points")[0]);
		    if (data_parts[1].indexOf("critical") != -1) {
			damage = "<span class=\"crit\">" + damage + "</span>";
		    } else {
			damage = damage;
		    }
	            spellname = "/js/images/" + spell.toLowerCase().replace(/ /g,"") + ".png";
			if (imageExists(spellname)) {
				return attacker + " <img src='" + spellname + "'/ height=24 width=24 style=\"position:relative; top:6px;\">&#x1f480;" + damage + " " + killed + "<span style=\"padding-left:4px;color: #bbbbbb; font-size:14px; line-height:16px;\">["+spell+"]</span>";
			} else if (spellname != "Attack") {
				return killer + " " + damage + " "+ killed + " with "+spell;
			} else {
				return killer + " " + damage + " " + killed;
			}
	    }
	
	} else {
		return data;
	}

}
function killString(data) {
	data_parts = data.split(" has been slain by ");
	killed = data_parts[0];
	if (data_parts[1].indexOf("'") !== -1) {
		killer_parts = data_parts[1].split("'");
		killer = killer_parts[0];
		spell = killer_parts[1].substring(2).replace("!","");
	} else {
		killer = data_parts[1].replace("!","");
		spell = "Attack";
	}
	spellname = "/js/images/" + spell.toLowerCase().replace(/ /g,"") + ".png";
	console.log(spellname);
	if (imageExists(spellname)) {
		return killer + " killed " + killed + " with <img src='" + spellname + "'/ height=24 width=24 style=\"position:relative; top:6px;\"><span style=\"padding-left:4px;color: #bbbbbb; font-size:14px; line-height:16px;\">["+spell+"]</span>";
	} else if (spell != "Attack") {
		return killer + " killed " + killed + " with "+spell;
	} else {
		return killer + " killed " + killed;
	}
	return data;
}
function imageExists(image_url){
    if (image_url in imageCache) {
        return imageCache[image_url];
    }
    var http = new XMLHttpRequest();

    http.open('HEAD', image_url, false);
    http.send();
    imageCache[image_url] = http.status != 404;
    return http.status != 404;

}
