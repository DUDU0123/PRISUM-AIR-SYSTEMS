// Main JS for PRISUM AIR SYSTEMS SPA
// Uses ES modules (firebase.js) for Firestore

import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot } from './firebase.js';

const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz3P5cidBSMs_hXt3uSLU5Os37AKtS8eSElQSLYp3ALKqTVfOi7Py5yBb0K6oNPfKZL/exec';

// Elements
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const snackbarEl = document.getElementById('snackbar');
function showSnackbar(message, type = 'success'){
  if(!snackbarEl) return;
  snackbarEl.className = '';
  snackbarEl.textContent = message;
  snackbarEl.classList.add('show');
  snackbarEl.classList.add(type === 'error' ? 'error' : 'success');
  setTimeout(()=>{ snackbarEl.className = ''; }, 3600);
}

// Mobile nav toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks){
  hamburger.addEventListener('click', ()=>{
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>navLinks.classList.remove('open')));
}

// Active link on scroll
const sections = Array.from(document.querySelectorAll('section[id]'));
const navAnchors = Array.from(document.querySelectorAll('.nav a'));
function updateActiveNav(){
  const scrollPos = window.scrollY + 100; // Adjusted offset for fixed header
  for(const section of sections){
    const rect = section.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const bottom = top + section.offsetHeight;
    if(scrollPos >= top && scrollPos < bottom){
      navAnchors.forEach(a=>a.classList.toggle('active', a.getAttribute('href') === `#${section.id}`));
      break;
    }
  }
}
window.addEventListener('scroll', updateActiveNav);
updateActiveNav();

// Smooth scroll for navigation links
navAnchors.forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      const headerHeight = 72; // Fixed header height
      const targetPosition = targetSection.offsetTop - headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Reveal-on-scroll animations
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, {threshold: 0.12});
revealEls.forEach(el => io.observe(el));

// Contact form validation and submit
const contactForm = document.getElementById('contactForm');
if (contactForm){
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    // Regex rules
    const nameOk = /^[A-Za-z ]{2,60}$/.test(name);
    const phoneOk = /^[6-9]\d{9}$/.test(phone);
    const emailOk = /^[\w.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/.test(email);
    const noScript = (s) => !/[<>]/.test(s) && !/script/i.test(s);
    const msgOk = message.length >= 2 && noScript(message);

    if(!nameOk){ return showSnackbar('Please enter a valid name (letters and spaces only).', 'error'); }
    if(!phoneOk){ return showSnackbar('Please enter a valid 10-digit Indian mobile number', 'error'); }
    if(!emailOk){ return showSnackbar('Please enter a valid email address.', 'error'); }
    if(!msgOk){ return showSnackbar('Message cannot be empty', 'error'); }

    const payload = new URLSearchParams({
      Timestamp: new Date().toISOString(),
      Name: name,
      Phone: phone,
      Email: email,
      Message: message
    });

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; submitBtn.setAttribute('aria-busy','true'); }

    try{
      await fetch(GOOGLE_SHEETS_ENDPOINT, {
        method:'POST',
        // mode:'no-cors',
        headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString()
      });
      contactForm.reset();
      showSnackbar('Thanks! Your message has been sent.');
    }catch(err){
      console.error(err);
      showSnackbar('Failed to send message. Please try again later.', 'error');
    }finally{
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText || 'Send Message'; submitBtn.removeAttribute('aria-busy'); }
    }
  });
}

// Testimonials: fetch and render, plus form to add
const testimonialsRow = document.getElementById('testimonialsRow');
const testimonialForm = document.getElementById('testimonialForm');
const ratingStarsWrap = document.getElementById('tRatingStars');

// Interactive star rating (1-5)
if(ratingStarsWrap){
  const hiddenRating = document.getElementById('tRating');
  const starBtns = Array.from(ratingStarsWrap.querySelectorAll('.star'));
  const setActive = (n)=>{
    starBtns.forEach(btn=>{
      const val = Number(btn.dataset.value);
      btn.classList.toggle('active', val <= n);
      btn.textContent = val <= n ? '★' : '☆';
      btn.setAttribute('aria-checked', String(val === n));
      btn.setAttribute('role','radio');
    });
  };
  starBtns.forEach(btn=>btn.addEventListener('click', ()=>{
    const n = Number(btn.dataset.value);
    hiddenRating.value = String(n);
    setActive(n);
  }));
}

function renderStars(n){
  const max = 5; const full = '★'.repeat(n); const empty = '☆'.repeat(Math.max(0, max - n));
  return `<span class="stars" aria-label="${n} out of 5 stars">${full}${empty}</span>`;
}

function cardTemplate(t){
  const safeName = t.name;
  const safeRole = t.role;
  const safeExp = t.experience;
  return `<article class="t-card"><div class="t-name">${safeName}</div><div class="t-role">${safeRole}</div>${renderStars(Number(t.rating))}<p>${safeExp}</p></article>`;
}

async function loadTestimonials(){
  try{
    const q = query(collection(db, 'testimonials'), orderBy('createdAt','desc'));
    // Live updates
    onSnapshot(q, (snap)=>{
      const docs = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      testimonialsRow.innerHTML = docs.map(cardTemplate).join('');
      
      // Position cards after loading
      setTimeout(() => {
        positionTestimonialCards();
        startAutoRotate();
      }, 100);
    });
  }catch(err){
    console.error('Testimonials load error', err);
  }
}
if(testimonialsRow){ loadTestimonials(); }

if(testimonialForm){
  testimonialForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('tName').value.trim();
    const role = document.getElementById('tRole').value.trim();
      const rating = document.getElementById('tRating').value.trim();
    const experience = document.getElementById('tExp').value.trim();
    const nameOk = /^[A-Za-z ]{2,60}$/.test(name);
    const noScript = (s) => !/[<>]/.test(s) && !/script/i.test(s);
    const expOk = experience.length >= 3 && noScript(experience);
    const ratingOk = /^(1|2|3|4|5)$/.test(rating);
    if(!nameOk){ return showSnackbar('Please enter a valid name for testimonial.', 'error'); }
    if(!role){ return showSnackbar('Please enter a role / company.', 'error'); }
    if(!ratingOk){ return showSnackbar('Please select a rating from 1 to 5.', 'error'); }
    if(!expOk){ return showSnackbar('Experience cannot contain scripts or angle brackets.', 'error'); }
    const submitBtn = testimonialForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; submitBtn.setAttribute('aria-busy','true'); }

    try{
      await addDoc(collection(db,'testimonials'), {
        name, role, rating:Number(rating), experience, createdAt: serverTimestamp()
      });
      testimonialForm.reset();
      showSnackbar('Thanks for your feedback!');
    }catch(err){
      console.error(err);
      showSnackbar('Could not submit testimonial. Please try again later.', 'error');
    }finally{
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText || 'Submit Testimonial'; submitBtn.removeAttribute('aria-busy'); }
    }
  });
}

// Rotating Carousel for Testimonials
let currentRotation = 0;
let testimonials = [];
let totalTestimonials = 0;

function positionTestimonialCards() {
  const cards = testimonialsRow.querySelectorAll('.t-card');
  totalTestimonials = cards.length;
  
  if (totalTestimonials === 0) return;
  
  // Adjust radius based on screen size
  const isMobile = window.innerWidth <= 768;
  const isSmallMobile = window.innerWidth <= 480;
  const isExtraSmall = window.innerWidth <= 360;
  const radius = isExtraSmall ? 200 : isSmallMobile ? 250 : isMobile ? 300 : 400; // Smaller radius for smaller screens
  const angleStep = (2 * Math.PI) / totalTestimonials;
  
  cards.forEach((card, index) => {
    const angle = angleStep * index + currentRotation;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const opacity = z > 0 ? 1 : 0.3;
    const scale = z > 0 ? 1 : 0.8;
    
    card.style.transform = `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) scale(${scale})`;
    card.style.opacity = opacity;
    card.style.zIndex = Math.round(z);
  });
}

function rotateCarousel(direction) {
  if (totalTestimonials === 0) return;
  
  const angleStep = (2 * Math.PI) / totalTestimonials;
  currentRotation += direction * angleStep;
  positionTestimonialCards();
}

// Carousel controls
const prevBtn = document.getElementById('prevT');
const nextBtn = document.getElementById('nextT');

if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => rotateCarousel(-1));
  nextBtn.addEventListener('click', () => rotateCarousel(1));
}

// Auto-rotate carousel every 5 seconds
let autoRotateInterval;
function startAutoRotate() {
  autoRotateInterval = setInterval(() => {
    rotateCarousel(1);
  }, 5000);
}

function stopAutoRotate() {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
  }
}

// Pause auto-rotation when user interacts
if (prevBtn && nextBtn) {
  prevBtn.addEventListener('mouseenter', stopAutoRotate);
  nextBtn.addEventListener('mouseenter', stopAutoRotate);
  prevBtn.addEventListener('mouseleave', startAutoRotate);
  nextBtn.addEventListener('mouseleave', startAutoRotate);
}

// Reposition cards on window resize
window.addEventListener('resize', () => {
  positionTestimonialCards();
});


