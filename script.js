"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const deleteBtn = document.querySelector(".workout_remove");
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _createDesctiption() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.name[0].toUpperCase()}${this.name.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  name = "running";
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._createDesctiption();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  name = "cycling";
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._createDesctiption();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class App {
  #map;
  #mapEvent;
  #mapZoom = 13;
  workouts = [];
  markers = [];
  marker;
  constructor() {
    this._getCoordinates();
    this._getData();
    form.addEventListener("submit", this._newWorkout.bind(this));
    document.addEventListener("keydown", this._forMac.bind(this));
    inputType.addEventListener("change", this._toggleWorkoutField);
    containerWorkouts.addEventListener("click", this._moveToPoint.bind(this));
    // containerWorkouts.addEventListener("click", this._removeWorkout.bind(this));
    // console.log(this.markers);
  }

  _forMac(e) {
    if (e.key === "Enter") this._newWorkout();
  }
  _getCoordinates() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("Unfortunately, I can't read your location");
      }
    );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const location = [latitude, longitude];

    this.#map = L.map("map").setView(location, this.#mapZoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));

    this.workouts.forEach((work) => {
      this._putMarker(work);
    });
  }
  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _formClear() {
    inputDistance.value =
      inputCadence.value =
      inputElevation.value =
      inputDuration.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _newWorkout(e) {
    e.preventDefault();

    const inputValidation = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const inputPositive = (...inputs) => inputs.every((inp) => inp > 0);
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;

    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !inputValidation(distance, duration, cadence) ||
        !inputPositive(distance, duration, cadence)
      )
        return alert("Please, enter only positive numbers");

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !inputValidation(distance, duration, elevation) ||
        !inputPositive(distance, duration)
      )
        return alert("Please, enter only positive numbers");

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    this.workouts.push(workout);

    this._putMarker(workout);

    this._setWorkoutContent(workout);

    this._formClear();

    this._setData();
  }

  // _removeMarker(workout) {}

  _putMarker(workout) {
    this.marker = new L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();

    this.markers.push(this.marker);
  }

  _setWorkoutContent(workout) {
    let html = `
    <li class="workout--cover workout--${workout.name}" data-id="${workout.id}">
          <div class="workout--top">
            <h2 class="workout__title">${workout.description}</h2>
            <span class="workout_remove" data-id="${workout.id}">🗑️</span>
          </div>
           <div class="workout">
           <div class="workout__details">
             <span class="workout__icon">${
               workout.name === "running" ? "🏃‍♂️" : "🚴‍♀️"
             }</span>
             <span class="workout__value">${workout.distance}</span>
             <span class="workout__unit">km</span>
           </div>
           <div class="workout__details">
             <span class="workout__icon">⏱</span>
             <span class="workout__value">${workout.duration}</span>
             <span class="workout__unit">min</span>
           </div>
    `;

    if (workout.name === "running") {
      html += `<div class="workout__details">
       <span class="workout__icon">⚡️</span>
       <span class="workout__value">${workout.pace.toFixed(1)}</span>
       <span class="workout__unit">min/km</span>
     </div>
     <div class="workout__details">
       <span class="workout__icon">🦶🏼</span>
       <span class="workout__value">${workout.cadence}</span>
       <span class="workout__unit">spm</span>
     </div>
    </div>
  </li>`;
    }

    if (workout.name === "cycling") {
      html += `
       <div class="workout__details">
             <span class="workout__icon">⚡️</span>
             <span class="workout__value">${workout.speed.toFixed(1)}</span>
             <span class="workout__unit">km/h</span>
           </div>
           <div class="workout__details">
             <span class="workout__icon">⛰</span>
             <span class="workout__value">${workout.elevationGain}</span>
             <span class="workout__unit">m</span>
           </div>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML("afterend", html);
  }
  _toggleWorkoutField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _moveToPoint(e) {
    const workoutEl = e.target.closest(".workout--cover");

    if (!workoutEl) return;
    const workout = this.workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setData() {
    localStorage.setItem("workouts", JSON.stringify(this.workouts));
  }

  _getData() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.workouts = data;

    this.workouts.forEach((work) => {
      this._setWorkoutContent(work);
    });
  }

  // _removeWorkout(e) {
  //   const workoutEl = e.target.closest(".workout_remove");

  //   if (!workoutEl) return;

  //   const workout = this.workouts.find(
  //     (work) => work.id === workoutEl.dataset.id
  //   );

  //   const workoutBlock = e.target.closest(".workout--cover");
  //   const marker = this.markers.find((marker) => {
  //     marker.coords = workout.coords;
  //   });
  //   console.log(marker);
  //   workoutBlock.style.display = "none";
  //   this.#map.removeLayer(marker);

  //   this.workouts.pop(workout);
  // }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();

document.addEventListener("keydown", function (e) {
  const key = e.key.toLocaleLowerCase();
  if (key === "r") app.reset();
});
