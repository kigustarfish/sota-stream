var imageCache = {};

$(function() {
	doPoll()
})
function doPoll(){
    $.post('/chat', function(data) {
        processData(JSON.parse(data));
        setTimeout(doPoll,5000);
    });
}
function processData(data) {
	$("#message-list").empty();
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
		$("#message-list").append($("<li class='"+item.type+"'>").html(val));
		$("#message-list li").each(function(){$(this).kappa();});
	}
}
function attackString(data) {
	data_parts = data.split(" attacks ");
	attacker = data_parts[0];
	killer = attacker
        if (data_parts[1].indexOf("and hits")!= -1) {
            if (data_parts[1].indexOf("damage.")!= -1) {
		    return data;
	    } else {
		    spell_parts = data_parts[1].split(" from ");
		    killed = data_parts[1].split("and")[0];
		    if (spell_parts.length < 2) return;
		    spell = spell_parts[1].replace(".","").trim();
		    damage = parseInt(data_parts[1].split("dealing")[1].split("points")[0]);
		    if (data_parts[1].indexOf("critical") != -1) {
			damage = "<span class=\"crit\">" + damage + "!</span>";
		    } else {
			damage = damage;
		    }
	            spellname = "/js/images/" + spell.toLowerCase().replace(/ /g,"") + ".png";
			if (imageExists(spellname)) {
				return attacker + " <img src='" + spellname + "'/ height=24 width=24 style=\"position:relative; top:6px;\">&#x1f480;" + damage + " " + killed + "<span style=\"padding-left:4px;color: #bbbbbb; font-size:14px; line-height:16px;\">["+spell+"]</span>";
			} else if (spellname != "Attack") {
				return killer + damage + " "+ killed + " with "+spell;
			} else {
				return killer + damage + " " + killed;
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
