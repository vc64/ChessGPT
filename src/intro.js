// Great video by Conor Bailey, code based off his video: https://www.youtube.com/watch?v=2ak37WrbSDg

let intro = document.querySelector(".intro");
let exitBtn = document.querySelector("#exitBtn");
let logoGroup = document.querySelectorAll(".logo");
let instructions = document.querySelectorAll(".text");

window.addEventListener('DOMContentLoaded', ()=>{

  setTimeout(()=>{
    
    logoGroup.forEach((part, idx)=>{
      setTimeout(()=>{
        part.classList.add('active');
      }, (idx+1) * 400);
    })
    
    logoGroup.forEach((part, idx)=>{
      setTimeout(()=>{
        part.classList.remove('active');
      }, (idx+1) * 50);
    });

    instructions.forEach((part, idx)=>{
      setTimeout(()=>{
        part.classList.add('active');
      }, 1500);
    });

    instructions.forEach((part, idx)=>{
      setTimeout(()=>{
        part.classList.remove('active');
      }, 50);
    });

    setTimeout(()=>{
      exitBtn.classList.add('active');
    }, 1500);

    setTimeout(()=>{
      exitBtn.classList.remove('active');
    }, 50);
  });
});


exitBtn.onclick = function(e) {
  setTimeout(()=>{
  
    setTimeout(()=>{
      intro.style.top = '-100vh';
    }, 100);
  
    setTimeout(()=>{
      intro.style.visibility = 'hidden';
    }, 500);
  
  });
}
