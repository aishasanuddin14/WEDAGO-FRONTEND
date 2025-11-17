const track = document.getElementById("wgHeroTrack");
const dots = document.querySelectorAll(".wg-hero-dots .dot");

let index = 0;

function goTo(i){
  index = i;
  track.style.transform = `translateX(-${i * 100}%)`;
  dots.forEach(d => d.classList.remove("active"));
  dots[i].classList.add("active");
}

dots.forEach((d,i)=>{
  d.addEventListener("click",()=>goTo(i));
});

setInterval(()=>{
  index = (index + 1) % dots.length;
  goTo(index);
}, 4500);

