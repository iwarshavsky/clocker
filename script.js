let db;
let clock;
const milliseconds_in_a_day = 1000 * 60 * 60 * 24;
function check_is_touch_device() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function createSVGElement(svg, name, attrs, xmlns = "http://www.w3.org/2000/svg") {
    var el = document.createElementNS(xmlns, name); // Creates element with specified NS (=Namespace) & name
    setAttributes(el, attrs);
    svg.appendChild(el);
    return el;
}

Date.prototype.dateToISOLikeButLocal = function () {
    const offsetMs = this.getTimezoneOffset() * 60 * 1000;
    const msLocal = this.getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    const isoLocal = iso.slice(0, 19);
    return isoLocal;
}
Date.prototype.addHours = function (h) {
    let date = new Date(this.getTime());
    date.setTime(date.getTime() + (h * 60 * 60 * 1000));
    return date;
}
Date.prototype.roundDown = function () {

    var tempDate = new Date();
    tempDate.setTime(this.getTime());
    tempDate.setMinutes(0);
    tempDate.setMilliseconds(0);
    tempDate.setSeconds(0);
    return tempDate;
}



let form;
class Form {
    constructor() {
        this.element = document.querySelector("form");
        this.elements = this.element.elements;
        this.checkValidity = function () { this.element.checkValidity(); }
    }
    clear() {
        var elements = this.element.elements;
        var params = {};
        for (let el of elements) {
            if (el["name"] != null && el["name"] != '') {
                params[el["name"]] = el["value"];
                // reset values after submission
                if (el["type"] != 'button') {
                    if (el["type"] == 'select-one') {
                        el["selectedIndex"] = 0;
                    } else if (el["type"] == 'color') {
                        el["value"] = '#000000';
                    }
                    else {
                        el["value"] = '';
                    }
                }
            }
        }
    }
    setup(actionName, event = undefined, id = undefined,) { // eventList = clock.eventList

        var elements = this.element.elements;
        var actions = {
            "addEvent": [5, "Add event", "none"],
            "updateEvent": [4, "Update event", ""],
            "deleteEvent": 6
        };
        if (actions.hasOwnProperty(actionName)) {

            Array.from(elements).filter(obj => { return obj.name === "action" })[0].value = actions[actionName][0];
            Array.from(elements).filter(obj => { return obj.type === "submit" })[0].value = actions[actionName][1];
            Array.from(elements).filter(obj => { return obj.classList.contains("formDelete") == true })[0].style.display = actions[actionName][2];
            Array.from(elements).filter(obj => { return obj.name === "dateStart" })[0].value = event.dateStart.dateToISOLikeButLocal();
            Array.from(elements).filter(obj => { return obj.name === "dateEnd" })[0].value = event.dateEnd.dateToISOLikeButLocal();
            Array.from(elements).filter(obj => { return obj.name === "event_ID" })[0].value = isNaN(event.event_ID) ? '' : event.event_ID;
            Array.from(elements).filter(obj => { return obj.name === "title" })[0].value = event.title;
            Array.from(elements).filter(obj => { return obj.name === "description" })[0].value = event.description;
            Array.from(elements).filter(obj => { return obj.name === "color" })[0].value = event.color;
        }

        if (actionName == "updateEvent") {
            this.show("Edit event");
        } else {
            this.show("New event");
        }
    }
    hide() {
        hideModal("form");
    }
    show(title = "", body = "") {
        showModal("form", title, body);
    }

}


class ClockState {
    clock;
    hourIndicator;
    dateIndicator;
    stateIndicator;
    currentState;
    timeInterval;
    updateInterval;
    goBackIndicator;
    stateIndicatorGroup;

    constructor(clock, parent) {
        // time indicator
        this.clock = clock;
        createSVGElement(parent, "circle", {
            "cx": 0,
            "cy": 0,
            "r": clock.innerCircleRadius - 3,
            "stroke": "gray",
            "stroke-width": "1.5px",
            "stroke-linecap": "round",
            "fill": "white",
            //"pointer-events": "none",
            "class": "goToPresentButtonClock"
        });
        this.hourIndicator = createSVGElement(parent, "text", {
            "x": "0",
            "y": -clock.innerCircleRadius / 4,
            "text-anchor": "middle",
            "alignment-baseline": "middle",
            "font-size": "13",
            "fill": "black",
            "stroke": "none",
            "class": "",
            "pointer-events": "none",
            "user-select": "none"
            // "letter-spacing": hourNumber != 0 ? "0px" : "-0.8px"
        });
        //this.hourIndicator.innerHTML = "10:00";

        this.dateIndicator = createSVGElement(parent, "text", {
            "x": "0",
            "y": clock.innerCircleRadius / 5,
            "text-anchor": "middle",
            "alignment-baseline": "middle",
            "font-size": "8",
            "fill": "black",
            "stroke": "none",
            "class": "",
            "pointer-events": "none",
            "user-select": "none",
            "letter-spacing": "-0.8px",

        });

        this.stateIndicatorGroup = createSVGElement(parent, "g", { "class": "stateIndicatorGroup" });

        this.stateIndicator = createSVGElement(this.stateIndicatorGroup, "text", {
            "x": "0",
            "y": -clock.innerCircleRadius * 5 / 8,
            "text-anchor": "middle",
            "alignment-baseline": "middle",
            "font-size": "3.5",
            "fill": "darkgrey",
            "stroke": "none",
            "class": "",
            "pointer-events": "none",
            "user-select": "none",
            //"letter-spacing": "-0.8px",

        });

        this.stateIndicator.innerHTML = "Pointing at:";


        this.goBackIndicator = createSVGElement(this.stateIndicatorGroup, "text", {
            "x": "0",
            "y": clock.innerCircleRadius * 5 / 8,
            "text-anchor": "middle",
            "alignment-baseline": "middle",
            "font-size": "3.5",
            "fill": "darkgrey",
            "stroke": "none",
            "class": "",
            "pointer-events": "none",
            "user-select": "none",
            //"letter-spacing": "-0.8px",

        });

        this.goBackIndicator.innerHTML = "Press to return";
        this.start_present_mode();
    }

    presentMode;

    start_present_mode() {
        this.presentMode = true;
        this.timeInterval = setInterval(this.showTime.bind(this), 500);
        this.updateInterval = setInterval(this.reload_clock.bind(this), 1000 * 60 * 2);
        this.stateIndicatorGroup.classList.add("hide");
    }

    stop_present_mode() {
        this.presentMode = false;
        clearInterval(this.timeInterval);
        clearInterval(this.updateInterval);
        this.stateIndicatorGroup.classList.remove("hide");
    }

    time_str(date) {
        var h = date.getHours(); // 0 - 23
        var m = date.getMinutes(); // 0 - 59
        var s = date.getSeconds(); // 0 - 59
        h = (h < 10) ? "0" + h : h;
        m = (m < 10) ? "0" + m : m;
        s = (s < 10) ? "0" + s : s;

        var delim = this.presentMode && s % 2 == 1 ? " " : ":";
        return h + delim + m; // blinking ":"
    }


    date_str(date) {

        return date.toLocaleDateString("en-US", { weekday: 'short' }) + " " + date.getDate() + "/" + (date.getMonth() + 1);
    }

    showTime() {
        var date = new Date();
        this.update_datetime(date);
    }

    reload_clock() {
        this.stop_present_mode();
        this.clock.load(new Date());
        this.start_present_mode();
    }

    start_explore_mode() {
        this.stop_present_mode();

    }

    stop_explore_mode() {
        if (!this.presentMode) {
            this.reload_clock();
        }

    }

    update_datetime(date) {
        this.hourIndicator.innerText = this.time_str(date);
        this.hourIndicator.textContent = this.time_str(date);
        this.dateIndicator.innerText = this.date_str(date);
        this.dateIndicator.textContent = this.date_str(date);

    }


}


class Clock {
    // circle vs list
    constructor() {
        this.element = document.getElementById('clock');
        this.resize();
        this.element.setAttribute("viewBox", `${-this.radius + 12} ${-this.radius + 12} ${this.radius * 2 - 24} ${this.radius * 2 - 24}`);
        this.create_ClockBase(this.element);
        this.state = new ClockState(this, this.element);

        this.updatable_group = createSVGElement(this.element, "g", { "class": "updatable_group" });

        this.outerRing = createSVGElement(this.updatable_group, "g", { "class": "hourRing" });
        this.eventElements = createSVGElement(this.updatable_group, "g", { "class": "eventElements" });
        this.date = new Date();
        this.date_offset_hours = - this.date.getTimezoneOffset() / 60; // Add this to uTFC time
        this.requestEvents = this.requestEvents.bind(this);
        this.createEvents = this.createEvents.bind(this);

    }
    get center() {
        return {
            x: this.element.getClientRects()[0].x + clock.element.getClientRects()[0].width / 2,
            y: this.element.getClientRects()[0].y + clock.element.getClientRects()[0].height / 2
        }
    }
    load(date = this.date) {
        this.setDate(date);
        this.requestEvents();
    }


    resize() {
        this.element.setAttribute("width", this.dimensions.width);
        this.element.setAttribute("height", this.dimensions.height);
    }
    dimensions = {
        get width() { return Math.max(document.documentElement.clientWidth, window.innerWidth || 0); },
        get height() { return Math.max(document.documentElement.clientHeight, window.innerHeight || 0); },
        get min() { return Math.min(this.dimensions.width, this.dimensions.height); }
    };

    eventList = [];
    updatable_group;
    outerRing;
    eventElements;
    rotation;

    hourIndicator;
    dateIndicator;
    presentMode = 1;

    date; // should be iso
    date_offset_hours;

    setDate(newDate) {
        this.date.setTime(newDate.getTime());
    }

    requestEvents() {

        // Populate eventList

        var nextDay = new Date(this.date.getTime() + 86400000);
        this.clear();
        const objectStore = db.transaction('eventList').objectStore('eventList');
        this.eventElements = createSVGElement(this.updatable_group, "g", { "class": "eventElements" });

        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            // Check if there are no (more) cursor items to iterate through
            if (!cursor) {
                // No more items to iterate through, we quit.
                this.create_hours(this.outerRing);
                this.createEvents();
                return;
            }


            if (this.date.getTime() <= (new Date(cursor.value.dateEnd)).getTime() && (new Date(cursor.value.dateStart)).getTime() <= nextDay.getTime()) {

                this.eventList.push(new ClockEvent(
                    this,
                    this.eventElements,
                    cursor.key,
                    new Date(Date.parse(cursor.value.dateStart)),
                    new Date(Date.parse(cursor.value.dateEnd)),
                    cursor.value.title,
                    cursor.value.description,
                    cursor.value.color
                ));
            }


            cursor.continue();
        };

    }

    // Create clock BACKGROUND
    create_ClockBase(parent) {

        //create back and forward buttons.
        createSVGElement(parent, "rect", {
            "x": 0 - (this.clockRadius + this.spaceOuterRing),
            "y": -this.radius,
            "width": this.clockRadius + this.spaceOuterRing,
            "height": this.radius
            //"class":"baseHourCircle",
            //"id":d_clean.toISOString()//d_clean.getTime()
        });
        createSVGElement(parent, "rect", {
            "x": 0,
            "y": -this.radius,
            "width": this.clockRadius + this.spaceOuterRing,
            "height": this.radius
            //"class":"baseHourCircle",
            //"id":d_clean.toISOString()//d_clean.getTime()
        });

        // create outer ring
        createSVGElement(parent, "circle", {
            "cx": "0",
            "cy": "0",
            "r": this.clockRadius + this.spaceOuterRing,
            //"fill":"none",
            //"stroke":"black",
            "class": "baseClock",
            "stroke": "#4c5239",
            "stroke-width": "0.2",
            "fill": "black"
        });

        // Conic circle gradient
        let div_container = createSVGElement(parent, "foreignObject", {
            "x": `-${this.clockRadius}`,
            "y": `-${this.clockRadius}`,
            "width": `${this.clockRadius * 2}`,
            "height": `${this.clockRadius * 2}`,
            "class": "innerCircle"
        });

        var node = document.createElement("div");
        node.setAttribute("style", "background: conic-gradient(white, white, black); width:100%; height:100%;clip-path: circle(75px at 75px 75px);");
        node.classList.add("innerCircle");
        div_container.appendChild(node);

        // Create Clock center button


        createSVGElement(parent, "circle", {
            "cx": 0,
            "cy": 0,
            "r": this.innerCircleRadius,
            "class": "baseInnerCircle",
            "fill": "white",
            "pointer-events": "none"
        });

    }

    create_hours(parent) {


        this.outerRing = createSVGElement(this.updatable_group, "g", { "class": "hourRing" });
        parent = this.outerRing;
        var clockSlices = 24;

        var startRadians = Math.PI / 2 - (2 * Math.PI / clockSlices) * (1 - this.date.getMinutes() / 60); // rotate by minutes

        // d_clean has the same date and hour as this.date, meant for the hour stored in the elements.
        var d_clean = this.date.addHours(1).roundDown();
        //var d_clean = new Date(this.date.getTime());

        for (var i = 0, radians = startRadians, curTime = d_clean; i < clockSlices;
            i++,
            radians -= 2 * Math.PI / clockSlices,
            curTime = curTime.addHours(1)
        ) {

            var halfHourRadians = radians + (2 * Math.PI / 48);
            let hourNumber = curTime.getHours();

            // hour semi ring
            createSVGElement(parent, "path", {
                "d": `M ${(this.clockRadius + this.spaceOuterRing) * Math.cos(radians - (2 * Math.PI / 48))} ${-(this.clockRadius + this.spaceOuterRing) * Math.sin(radians - (2 * Math.PI / 48))}
            A ${(this.clockRadius + this.spaceOuterRing)} ${(this.clockRadius + this.spaceOuterRing)} 0 0 0 ${(this.clockRadius + this.spaceOuterRing) * Math.cos(radians + (2 * Math.PI / 48))} ${-(this.clockRadius + this.spaceOuterRing) * Math.sin(radians + (2 * Math.PI / 48))}
            L ${(this.clockRadius) * Math.cos(radians + (2 * Math.PI / 48))} ${-(this.clockRadius) * Math.sin(radians + (2 * Math.PI / 48))}
            A ${(this.clockRadius)} ${(this.clockRadius)} 0 0 1 ${(this.clockRadius) * Math.cos(radians - (2 * Math.PI / 48))} ${-(this.clockRadius) * Math.sin(radians - (2 * Math.PI / 48))}
            Z`,
                //"fill":hourNumber != 0?"none":"white",
                "class": "baseHourCircle",
                "id": curTime.toISOString()
            });

            // hour circle
            createSVGElement(parent, "circle", {
                "cx": (this.clockRadius + 6) * Math.cos(radians),
                "cy": -(this.clockRadius + 6) * Math.sin(radians),
                "r": hourNumber != 0 ? 5 : this.spaceOuterRing / 2,
                "pointer-events": "none",
                "fill": hourNumber != 0 ? "none" : "white",
                "stroke": "grey",
                "stroke-width": "0.1px"
                //"class":"baseHourCircle",
                //"id":d_clean.toISOString()//d_clean.getTime()
            });

            // half hour lines
            createSVGElement(parent, "path", {
                "d": `M ${(this.clockRadius) * Math.cos(halfHourRadians)} ${-(this.clockRadius) * Math.sin(halfHourRadians)}
            L ${(this.clockRadius + this.spaceOuterRing) * Math.cos(halfHourRadians)} ${-(this.clockRadius + this.spaceOuterRing) * Math.sin(halfHourRadians)}`,
                //"stroke-linecap": "round",
                "stroke-width": "1px",
                "stroke": "black"
            });
            createSVGElement(parent, "path", {
                "d": `M ${(this.clockRadius + 4) * Math.cos(halfHourRadians)} ${-(this.clockRadius + 4) * Math.sin(halfHourRadians)}
            L ${(this.clockRadius + 8) * Math.cos(halfHourRadians)} ${-(this.clockRadius + 8) * Math.sin(halfHourRadians)}`,
                "stroke-linecap": "round",
                "stroke-width": "1px",
                "stroke": "#0a0909"
            });

            // Hour lines from center
            createSVGElement(parent, "path", {
                "d": `M ${(this.innerCircleRadius) * Math.cos(radians)} ${-(this.innerCircleRadius) * Math.sin(radians)} ` + // `M 0 0 `
                    `L ${(this.clockRadius) * Math.cos(radians)} ${-(this.clockRadius) * Math.sin(radians)}`,
                "stroke-width": "0.25",
                "stroke": "#CCCCCC"
            });



            var hour = createSVGElement(parent, "text", {
                "x": (this.clockRadius + 6) * Math.cos(radians),
                "y": -(this.clockRadius + 6) * Math.sin(radians),
                "text-anchor": "middle",
                "alignment-baseline": "middle",
                "font-size": hourNumber != 0 ? "5.5" : "5",
                "fill": hourNumber != 0 ? "white" : "red",
                "stroke": "none",
                "class": "baseHour noSelect hourCircle " + (hourNumber != 0 ? "" : "dateCircle"),
                "pointer-events": "none",
                "user-select": "none",
                "letter-spacing": hourNumber != 0 ? "0px" : "-0.8px"
            });


            // Don't write "0" at midnight
            if (hourNumber != 0) {
                hour.innerHTML = hourNumber;
            }
            else {
                hour.innerHTML = curTime.getDate() + "." + (curTime.getMonth() + 1);
            }

        }


    }

    createEvents() {

        var eventCount = 0;
        for (var event of this.eventList) {
            event.draw();
            eventCount++;


        }

        var now = new Date();
        if (this.date.getTime() <= now.getTime() && now.getTime() <= this.date.addHours(24).getTime()) {
            var dialWidth = 2;
            let basehandPresent = createSVGElement(this.eventElements, "path", {
                "d": `M 0 ${-this.innerCircleRadius + 5}
            l ${-dialWidth / 2} 0
            V ${-(this.clockRadius + this.spaceOuterRing - 2)}
            L 0 ${-(this.clockRadius + this.spaceOuterRing)}
            L ${dialWidth / 2} ${-(this.clockRadius + this.spaceOuterRing - 2)}
            v ${(this.clockRadius + this.spaceOuterRing - 2 - this.innerCircleRadius + 5)}
            Z`,//${(this.clockRadius+3)*-1+20}
                "fill": "none",
                "stroke": "white",
                "fill": "darkgrey",
                "class": "basehandPresent",
                "stroke-linecap": "butt",
                "stroke-width": "0.25px"
            });

            var present_text = createSVGElement(this.eventElements, "text", {
                "x": this.clockRadius * 4 / 5,//-this.innerCircleRadius,
                "y": 0,//-dialWidth/2,
                "height": dialWidth,
                "width": this.clockRadius,
                "text-anchor": "middle",
                "alignment-baseline": "middle",
                "font-size": "2",
                "fill": "white",
                "pointer-events": "none",
                "user-select": "none",
                "letter-spacing": "2px",
            });

            present_text.innerHTML = "PRESENT";

            // calculate angle to present
            let selectedDate = this.date.getTime();
            let presentDate = now.getTime();
            let angle = (presentDate - selectedDate) / (24 * 60 * 60 * 1000) * 360;
            basehandPresent.style.transform = "rotate(" + angle + "deg)";
            present_text.style.transform = "rotate(" + (angle - 90) + "deg)";

        }

        var dialWidth = 3;
        createSVGElement(this.element, "path", {
            "d": `M 0 ${-this.innerCircleRadius + 5}
                l ${-dialWidth / 2} 0
                V ${-(this.clockRadius + this.spaceOuterRing - 2)}
                L 0 ${-(this.clockRadius + this.spaceOuterRing)}
                L ${dialWidth / 2} ${-(this.clockRadius + this.spaceOuterRing - 2)}
                v ${(this.clockRadius + this.spaceOuterRing - 2 - this.innerCircleRadius + 5)}
                Z`,//${(this.clockRadius+3)*-1+20}
            "fill": "none",
            "stroke": "white",
            "fill": "black",
            "class": "basehand",
            "stroke-linecap": "butt",
            "stroke-width": "0.25px"
        });

    }


    clear() {
        while (this.updatable_group.firstChild) {
            this.updatable_group.removeChild(this.updatable_group.firstChild);
        }
        this.eventList = [];
    }

    angle_diff_to_date(deg) {
        let time_to_change = Math.floor(deg / 0.25);
        return this.date.addHours(time_to_change / 60);

    }

    rotate(deg) {
        this.load(this.angle_diff_to_date(deg)); // after the rotation we remain in explore mode
        //this.state.stop_explore_mode();
    }

    start_rotation(e) {
        this.state.start_explore_mode();
        this.rotation = new ClockRotation(this, e);
        this.outerRing.classList.add("rotate");
        document.body.classList.add("rotate");
    }

    stop_rotation() {
        this.rotation.done();
        this.outerRing.classList.remove("rotate");
        document.body.classList.remove("rotate");
    }

    start_event_sketch(e) {
        this.event_sketch = new ClockEventSketch(this, e);
    }
    event_sketch;
    stop_event_sketch() {
        this.event_sketch.done();
    }


    radius = 100;
    clockPadding = 25;
    clockRadius = this.radius - this.clockPadding;
    clockRadius_event = this.clockRadius - 4;
    innerCircleRadius = 30;
    spaceBetweenCrossAndCircle = 20;
    spaceOuterRing = 12;
}



var mouseDown = 0;
var mouseDrag = 0;
var mouseDrag_sketch = 0;
var is_touch_device = check_is_touch_device();



function firstLoad() {


    form = new Form();
    clock = new Clock();
    d = new Date();

    clock.load(d);

    document.querySelector("body").addEventListener("submit", function (e) {
        
        form.checkValidity();
        e.preventDefault();


        let temp_date_start = new Date(Date.parse(form.elements["dateStart"].value + "+00:00"));
        let date_to_trim_start = temp_date_start.addHours(-clock.date_offset_hours).toISOString();

        let temp_date_end = new Date(Date.parse(form.elements["dateEnd"].value + "+00:00"));
        let date_to_trim_end = temp_date_end.addHours(-clock.date_offset_hours).toISOString();

        const newEvent = [
            {
                description: form.elements["description"].value,
                color: form.elements["color"].value,
                title: form.elements["title"].value,
                dateStart: date_to_trim_start,
                dateEnd: date_to_trim_end
            }
        ];

        // open a read/write db transaction, ready for adding the data
        const transaction = db.transaction(["eventList"], "readwrite");

        // report on the success of the transaction completing, when everything is done
        transaction.oncomplete = (event) => {
            console.log("transaction completed");
            form.hide();
            showModal("message", "Success");
            form.clear();
            clock.load();
        };

        transaction.onerror = (event) => {
            console.error("transaction failure");
            form.hide();
            showModal("message", "Error", Error);
            console.log(Error);
        };

        // create an object store on the transaction
        const objectStore = transaction.objectStore("eventList");

        // Make a request to add our newItem object to the object store
        let key = form.elements["event_ID"].value

        const objectStoreRequest = key != '' ? objectStore.put(newEvent[0], parseInt(key)) : objectStore.put(newEvent[0]);

        objectStoreRequest.onsuccess = (event) => {
            console.log("Successfully stored")
        };

    }


    );

    document.querySelector("body").addEventListener(is_touch_device ? "touchstart" : "mousedown", function (e) {

        ++mouseDown;
        var target = is_touch_device ? e.touches[0].target : e.target;
        if (target.classList.contains("goToPresentButtonClock")) {
            clock.state.stop_explore_mode();
            return;
        }

        if (target.classList.contains("formDelete")) {

            const transaction = db.transaction(['eventList'], 'readwrite');
            transaction.objectStore('eventList').delete(parseInt(form.elements["event_ID"].value));
            console.log(`Deleting ${form.elements["event_ID"].value}`);

            // Report that the data item has been deleted
            transaction.oncomplete = () => {
                form.hide();
                form.clear();
                clock.load();
                console.log("deleted");
            };


        }
        else if (target.classList.contains("pathEvent")) {
            form.clear();
            var selected_event = clock.eventList.filter(function (ev) {
                return String(ev.event_ID) === target.id;
            })[0];
            form.setup("updateEvent", selected_event);


        } else {
            return;
        }
    });
    document.querySelector("body").addEventListener("keyup", function (e) {
        if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') {
            var isRtl = e.target.value.search(/[\u0590-\u05FF]/) >= 0 ? true : false;
            if (isRtl) {
                e.target.setAttribute("dir", "rtl");
            } else {
                e.target.setAttribute("dir", "");
            }
        }
    });
    window.addEventListener("resize", function (e) {
        clock.resize();
    });
    document.querySelector("body").addEventListener(is_touch_device ? "touchend" : 'mouseup', function (e) {

        if (mouseDrag > 0) {
            document.removeEventListener(is_touch_device ? "touchmove" : 'mousemove', clock.rotation.drag);
            clock.stop_rotation();
        };
        if (mouseDrag_sketch > 0) {
            document.removeEventListener(is_touch_device ? "touchmove" : 'mousemove', clock.event_sketch.drag);
            clock.stop_event_sketch();
        }

        mouseDrag = 0;
        mouseDrag_sketch = 0;
        mouseDown = 0;


    });

    document.addEventListener(is_touch_device ? "touchstart" : "mousedown", function (e) {
        let clicked_elements = document.querySelectorAll(":hover");
        for (const element of clicked_elements) {
            if (element.classList.contains("hourRing") && mouseDrag == 0) {
                clock.start_rotation(e);

                document.addEventListener(is_touch_device ? "touchmove" : 'mousemove', clock.rotation.drag);
                mouseDrag = 1;
            }
            if (element.classList.contains("innerCircle") && mouseDrag == 0 && mouseDrag_sketch == 0) {
                console.log("class is innerCircle and mouseDraw is 0");
                clock.start_event_sketch(e);
                mouseDrag_sketch = 1;
                document.addEventListener(is_touch_device ? "touchmove" : 'mousemove', clock.event_sketch.drag);
            }



        }

    });


}

/**
 * Class for a methods and variables of a mouse drag on the clock.
 */
class CircularDrag {
    // initial click creates the Rotation object
    constructor(clock, event) {
        this.clock = clock;
        this.center = clock.center;
        this.temp_date = new Date(clock.date.getTime());

        this.click_degrees = this.get_degrees(event.pageX, event.pageY, this.center.x, this.center.y);
        this.set_degrees = this.set_degrees.bind(this);

    }
    clock;
    center;
    click_degrees;
    revolutions = 0;
    angle_total = 0;
    angle_cur = 0;
    angle_prev = 0;
    temp_date;

    get_degrees(mouse_x, mouse_y, center_x, center_y) {
        const radians = Math.atan2(mouse_y - center_y, mouse_x - center_x);
        // console.log("mouse_y:", mouse_y, "mouse_x:", mouse_x, "center_y:", center_y, "center_x:", center_x);
        // WITH RESPECT TO POSITIVE Y AXIS (FROM 0 to 360)
        const degrees = ((Math.round((radians * (360 / (2 * Math.PI)))) + 90 + 360)) % 360;
        return degrees;
    }

    set_degrees(event) { // from cursor position
        this.angle_prev = this.angle_cur;
        // angle relative to this.click_degrees
        this.angle_cur = (this.get_degrees(event.pageX, event.pageY, this.center.x, this.center.y) - this.click_degrees + 360) % 360;

        // calculate revolutions
        if (this.angle_cur - this.angle_prev > 150) { this.revolutions--; }
        if (this.angle_cur - this.angle_prev < -150) { this.revolutions++; }
        this.angle_total = this.angle_cur + this.revolutions * 360;
        // console.log("this.angle_total", this.angle_total);
        // console.log("this.click_degrees", this.click_degrees);
        return this.angle_total;
    }
}

/**
This class only handles the rotation of the clock itself during dragging (temporary situtation)
*/
class ClockRotation extends CircularDrag {

    constructor(clock, event) {
        super(clock, event);
        this.drag = this.drag.bind(this);
    }

    drag(event) {
        this.set_degrees(event);
        clock.outerRing.style.transform = "rotate(" + -this.angle_cur + "deg)";
        clock.eventElements.style.transform = "rotate(" + -this.angle_cur + "deg)";
        var all = document.getElementsByClassName('hourCircle');
        for (var i = 0; i < all.length; i++) {
            all[i].style.transform = "rotate(" + this.angle_cur + "deg)";
            all[i].style.transformBox = "fill-box";
            all[i].style.transformOrigin = "center";
        }

        document.querySelector(".dateCircle").style.visibility = "hidden";
        clock.eventElements.classList.add("blurRotation");
        clock.state.update_datetime(clock.angle_diff_to_date(this.angle_total));

    }

    done() {
        clock.rotate(this.angle_total);
    }
}

/**
 * Class for event creation using drag.
 */
class ClockEventSketch extends CircularDrag {
    constructor(clock, event) {
        console.log("Sketch start");
        super(clock, event);
        this.drag = this.drag.bind(this);
        // determine nearest hour from mouse
        //console.log("Click degrees:",this.click_degrees);
        ////// Don't touch the angles, IT'S A NIGHTMARE!!!

        this.clicked_date = clock.angle_diff_to_date(this.click_degrees).roundDown();
        this.event = new ClockEvent(this.clock, this.clock.element, NaN, new Date(this.clicked_date.getTime()), this.clicked_date.addHours(1), "", "", "#888888");
        this.event.draw();
    }
    drag(event) {
        this.set_degrees(event);
        var cursor_date = clock.angle_diff_to_date((this.click_degrees + (this.angle_total % 360) + 360) % 360);


        if (this.clicked_date.getTime() == cursor_date.getTime()) {
            this.event.dateStart.setTime(this.clicked_date.getTime())
            this.event.dateEnd.setTime(this.clicked_date.addHours(1).getTime())

        }
        else if (this.clicked_date.getTime() > cursor_date.getTime()) {
            this.event.dateStart.setTime(cursor_date.roundDown().getTime())
            this.event.dateEnd.setTime(this.clicked_date.addHours(1).getTime());


        } else if (this.clicked_date.getTime() < cursor_date.getTime()) {
            this.event.dateStart.setTime(this.clicked_date.getTime())
            this.event.dateEnd.setTime(cursor_date.addHours(1).roundDown().getTime())
        }
        this.event.draw();

    }
    done() {
        this.event.remove();
        form.clear();
        form.setup("addEvent", this.event);
    }


}


/**
 * Show modal box.
 * @param {*} modalClass 
 * @param {*} title 
 * @param {*} bodyText 
 */
function showModal(modalClass, title = "", bodyText = "") {
    var modal = document.getElementById("myModal");
    modal.childNodes.get
    var modalBox = modal.getElementsByClassName(modalClass)[0];
    var span = modalBox.getElementsByClassName("close")[0];
    var modalBody = modalBox.getElementsByClassName("modal-body")[0];
    var modalTitle = modalBox.getElementsByClassName("modal-title")[0];
    var modalHeaderFooter = modalBox.getElementsByClassName("modal-headerfooter")[0];
    if (title.toUpperCase().includes("ERROR")) {
        modalHeaderFooter.classList.add("modalError");
    } else if (title.toUpperCase().includes("SUCCESS")) {
        modalHeaderFooter.classList.add("modalSuccess");
    }
    //
    modalTitle.innerHTML = title;
    if (modalBody != null) { modalBody.innerHTML = "<p>" + bodyText + "<p>"; }
    //modalHeaderFooter.childNodes[0].innerHeight = text;
    modal.style.display = "block";
    modalBox.style.display = "inherit";
    span.onclick = function () {
        modal.style.display = "none";
        modalBox.style.display = "none";
        if (modalBody != null) { modalBody.innerHTML = ""; }
        modalHeaderFooter.classList.remove("modalError");
        modalHeaderFooter.classList.remove("modalSuccess");
        form.clear();
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
            modalBox.style.display = "none";
            if (modalBody != null) { modalBody.innerHTML = ""; }
            modalHeaderFooter.classList.remove("modalError");
            modalHeaderFooter.classList.remove("modalSuccess");
            form.clear();
        }
    }
}

/**
 * Hide modal box
 * @param {*} modalClass 
 */
function hideModal(modalClass) {
    var modal = document.getElementById("myModal");
    modal.childNodes.get
    var modalBox = modal.getElementsByClassName(modalClass)[0];
    var modalBody = modalBox.getElementsByClassName("modal-body")[0];
    var modalHeaderFooter = modalBox.getElementsByClassName("modal-headerfooter")[0];

    modal.style.display = "none";
    modalBox.style.display = "none";
    if (modalBody != null) { modalBody.innerHTML = ""; }
    modalHeaderFooter.classList.remove("modalError");
    modalHeaderFooter.classList.remove("modalSuccess");
    form.clear()


}


/**
 * An event visible on the clock. Could also be an event which is currently being sketched.
 * In charge of creating the semi-donut shape.
 */
class ClockEvent {

    constructor(clock, parent, event_ID, dateStart, dateEnd, title, description, color) {
        this.event_ID = event_ID;
        this.dateStart = dateStart;
        this.dateEnd = dateEnd;
        this.title = title;
        this.description = description;
        this.color = color;
        this.clock = clock;
        this.parent = parent;
        this.g = createSVGElement(parent, "g", { "class": "event" });
        this.path = createSVGElement(this.g, "path", {});
        this.foreignObject = createSVGElement(this.g, "foreignObject", {},);
        this.eventDiv = createSVGElement(this.foreignObject, "div", {}, "http://www.w3.org/1999/xhtml");
        this.draw = this.draw.bind(this);
        this.draw();
    }


    draw() {
        function storeCoordinate(xVal, yVal, arr, dist = 0) {
            arr.push({ x: xVal, y: yVal, distance: dist });
        }

        var dateStart_raw = this.dateStart.getTime() - this.clock.date.getTime() + this.clock.date_offset_hours * 60 * 1000;
        var dateEnd_raw = this.dateEnd.getTime() - this.clock.date.getTime() + this.clock.date_offset_hours * 60 * 1000;

        var dateStart_milliSec = Math.max(dateStart_raw, 0);
        var dateEnd_milliSec = Math.min(dateEnd_raw, milliseconds_in_a_day);

        var dateStart_radian = Math.PI / 2 - 2 * Math.PI * (dateStart_milliSec / milliseconds_in_a_day);
        var dateEnd_radian = Math.PI / 2 - 2 * Math.PI * (dateEnd_milliSec / milliseconds_in_a_day);


        var innerCoords = [];
        storeCoordinate((this.clock.innerCircleRadius) * Math.cos(dateStart_radian), -(this.clock.innerCircleRadius) * Math.sin(dateStart_radian), innerCoords);
        storeCoordinate((this.clock.innerCircleRadius) * Math.cos(dateEnd_radian), -(this.clock.innerCircleRadius) * Math.sin(dateEnd_radian), innerCoords);
        var outerCoords = [];
        storeCoordinate((this.clock.clockRadius_event) * Math.cos(dateStart_radian), -(this.clock.clockRadius_event) * Math.sin(dateStart_radian), outerCoords);
        storeCoordinate((this.clock.clockRadius_event) * Math.cos(dateEnd_radian), -(this.clock.clockRadius_event) * Math.sin(dateEnd_radian), outerCoords);

        var biggerThanHalf = dateEnd_milliSec - dateStart_milliSec > milliseconds_in_a_day / 2 ? true : false;


        // create semi-donut
        setAttributes(this.path, {
            "d": `M ${outerCoords[0].x} ${outerCoords[0].y}
            A ${this.clock.clockRadius_event} ${this.clock.clockRadius_event} 0 ${biggerThanHalf ? 1 : 0} 1 ${outerCoords[1].x} ${outerCoords[1].y}
            L ${innerCoords[1].x} ${innerCoords[1].y}
            A ${this.clock.innerCircleRadius} ${this.clock.innerCircleRadius} 0 ${biggerThanHalf ? 1 : 0} 0 ${innerCoords[0].x} ${innerCoords[0].y}
            Z`,
            "stroke-width": "0.25",
            //"stroke":"#DDDDDD",
            "fill": this.color,//"red",// isSleep ? "orange" : (eventCount == 0 ? "Red" : "DarkRed"),
            "fill-opacity": 1 - (dateStart_milliSec / milliseconds_in_a_day * 0.75),// Math.round((0.8 - (key)/(this.eventList.length-1)*0.8)*100)/100, //"0.8", //range 0.8 - 0

            "stroke": "black",
            // "stroke-opacity": isSleep ? 1 : Math.round((1 - (key) / (this.eventList.length - 1) * 0.7) * 100) / 100,
            "class": "pathEvent",
            "id": this.event_ID

        });

        var m_inner = (innerCoords[1].y - innerCoords[0].y) / (innerCoords[1].x - innerCoords[0].x);
        var m_perp = -1 / m_inner;

        var outer_boxCoords = [];
        for (var k = 0; k < innerCoords.length; k++) {

            var x_current = innerCoords[k].x;
            var y_current = innerCoords[k].y;

            // I broke the equation down to smaller pieces.
            var R = this.clock.clockRadius_event;
            var G = x_current - (y_current / m_perp);
            var K = -2 * G / m_perp;
            var J = Math.pow(this.clock.clockRadius_event, 2) - Math.pow(G, 2);
            var Q = 1 / Math.pow(m_perp, 2) + 1;

            // two possible solutions for the new y (second degree equation)
            var y_current_continuation_option1 = (K + Math.sqrt(Math.pow(K, 2) + 4 * Q * J)) / (2 * Q);
            var y_current_continuation_option2 = (K - Math.sqrt(Math.pow(K, 2) + 4 * Q * J)) / (2 * Q);

            var x_of_y_current_continuation_option1_option1 = Math.sqrt(Math.pow(R, 2) - Math.pow(y_current_continuation_option1, 2));
            var x_of_y_current_continuation_option1_option2 = -Math.sqrt(Math.pow(R, 2) - Math.pow(y_current_continuation_option1, 2));
            var x_of_y_current_continuation_option2_option1 = Math.sqrt(Math.pow(R, 2) - Math.pow(y_current_continuation_option2, 2));
            var x_of_y_current_continuation_option2_option2 = -Math.sqrt(Math.pow(R, 2) - Math.pow(y_current_continuation_option2, 2));

            // are all of the points on the original line with slope m_perp?


            var coords = [];
            storeCoordinate(x_of_y_current_continuation_option1_option1, y_current_continuation_option1, coords);
            storeCoordinate(x_of_y_current_continuation_option1_option2, y_current_continuation_option1, coords);
            storeCoordinate(x_of_y_current_continuation_option2_option1, y_current_continuation_option2, coords);
            storeCoordinate(x_of_y_current_continuation_option2_option2, y_current_continuation_option2, coords);

            var coords_on_line = [];
            //var x_current, y_current;
            for (var i = 0; i < coords.length; i++) {
                var x = coords[i].x;
                var y = coords[i].y;

                var test_y = m_perp * (x - x_current) + y_current;
                if (Math.round(test_y * 100) / 100 == Math.round(y * 100) / 100) {
                    storeCoordinate(coords[i].x, coords[i].y, coords_on_line, Math.sqrt(Math.pow(coords[i].x - x_current, 2) + Math.pow(coords[i].y - y_current, 2)));
                }
                // two coordinates should be added
            }

            // last stage is to test which of the points is closest to the original point => distance is smaller.

            var closestCoord = function () {
                var closestDist;
                var coordinate;
                for (var c = 0; c < arguments[0].length; c++) {
                    if (closestDist == undefined || arguments[0][c].distance < closestDist) {
                        closestDist = arguments[0][c].distance;
                        coordinate = arguments[0][c];
                    }
                }
                return coordinate;
            };
            outer_boxCoords.push(closestCoord(coords_on_line));
            var coordinate_result = closestCoord(coords_on_line);
            //console.log(coordinate_result);

        }

        var dist_inners = Math.sqrt(Math.pow(innerCoords[1].y - innerCoords[0].y, 2) + Math.pow(innerCoords[1].x - innerCoords[0].x, 2));
        var dist_inner_outerBox = outer_boxCoords[0].distance;
        // now we need to check if there are any hebrew characters, in order to create the box RTL (which also changes it's origin)
        //var title = this.title;//Hebrew Character
        /*****************************************************
         * There seems to be a problem with "width" when there is an event from about 17:00 to 22:30 (angle-wise).
         */
        var rotation_deg = 90 - ((dateEnd_radian - dateStart_radian) / 2 + dateStart_radian) * 180 / Math.PI;
        setAttributes(this.foreignObject, {
            "x": this.clock.innerCircleRadius,
            "y": 0 - dist_inners / 2,
            "width": dist_inner_outerBox - this.clock.innerCircleRadius + Math.sqrt(Math.pow(this.clock.innerCircleRadius, 2) - Math.min(Math.pow(this.clock.innerCircleRadius, 2), Math.pow(dist_inners / 2, 2))),
            "height": dist_inners,
            "transform": `rotate(${-90}) rotate(${rotation_deg})`,
            "class": "noSelect",
            "pointer-events": "none"

        });

        // define font size based on box height;
        var fontSize;
        switch (true) {
            case (dist_inners < 5): fontSize = "3px"; break;
            case (dist_inners < 8): fontSize = "5px"; break;
            case (dist_inners < 12): fontSize = "6px"; break;
            case (dist_inners < 15): fontSize = "7px"; break;
            case (dist_inners < 20): fontSize = "8px"; break;
            default: fontSize = "9px";
        }
        var fontColor = "#FFFFFF"; //"#"+pad((Math.floor(((1-(eventCount)/(this.eventList.length-1)))*125)).toString(16),2).repeat(3);
        var fontWeight = "bold"; // eventCount != 0 ? "0" : "bold";
        setAttributes(this.eventDiv, { "class": `clockEventTitle`, "style": `font-size: ${fontSize}; color: ${fontColor}; font-weight: ${fontWeight}` });
        if (rotation_deg > 180) { this.eventDiv.classList.add("rotate"); }
        if (dist_inners < 5) {
            this.eventDiv.classList.add("small");
        } else {
            this.eventDiv.classList.add("normal");
        }


        var isRtl = this.title.search(/[\u0590-\u05FF]/) >= 0 ? true : false;
        if (isRtl) {
            this.eventDiv.setAttribute("dir", "rtl");
            //$ setAttributes(eventDiv,{"dir":"rtl"});
        } else {


        }

        // eventDiv.innerHTML = String.fromCodePoint(0x1F4A4); // sleep emoji
        this.eventDiv.innerHTML = this.title;


    }

    remove() {
        this.g.remove();
    }

}

window.onload = () => {
    // Hold an instance of a db object for us to store the IndexedDB data in

    const DBOpenRequest = window.indexedDB.open('eventList', 1);

    // Register two event handlers to act on the database being opened successfully, or not
    DBOpenRequest.onerror = (event) => {
        console.error(`Database error: ${event.target.errorCode}`);
    };

    DBOpenRequest.onsuccess = (event) => {
        console.log("DBOpenRequest.onsuccess");
        // Store the result of opening the database in the db variable. This is used a lot below
        db = event.target.result; //event.target.result?
        firstLoad();
        // Run the displayData() function to populate the task list with all the to-do list data already in the IndexedDB

    };

    // This event handles the event whereby a new version of the database needs to be created
    // Either one has not been created before, or a new version number has been submitted via the
    // window.indexedDB.open line above
    //it is only implemented in recent browsers
    DBOpenRequest.onupgradeneeded = (event) => {
        db = event.target.result;

        db.onerror = (event) => {
            console.error('Error loading database.');
        };

        // Create an objectStore for this database
        const objectStore = db.createObjectStore('eventList', { autoIncrement: true });

        // Define what data items the objectStore will contain
        objectStore.createIndex('dateStart', 'dateStart', { unique: false });
        objectStore.createIndex('dateEnd', 'dateEnd', { unique: false });
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('description', 'description', { unique: false });
        objectStore.createIndex('color', 'month', { unique: false });

    };

}


// rotation based on this: https://jsfiddle.net/o5jjosvu/65/