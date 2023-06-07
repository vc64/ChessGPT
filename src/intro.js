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
        // part.classList.add('fade');
      }, (idx+1) * 50);
    });

    instructions.forEach((part, idx)=>{
      setTimeout(()=>{
        part.classList.add('active');
        // part.classList.add('fade');
      }, 1500);
    });

    instructions.forEach((part, idx)=>{
      setTimeout(()=>{
        part.classList.remove('active');
        // part.classList.add('fade');
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
  //stop propagation of document click
  e.stopPropagation()

  setTimeout(()=>{
    // setTimeout(()=>{
    //   exitBtn.classList.remove('active');
    //   exitBtn.classList.add('fade');
    // }, 100);

    // logoGroup.forEach((part, idx)=>{
    //   setTimeout(()=>{
    //     part.classList.add('fade');
    //   }, (idx+1) * 100);
    // })
    
    setTimeout(()=>{
      intro.style.top = '-100vh';
    }, 100);
    setTimeout(()=>{
      intro.style.visibility = 'hidden';
    }, 500);
  });
}
