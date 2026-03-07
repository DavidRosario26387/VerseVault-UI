let page = 1
const PAGE_SIZE = 6
async function loadImages(){
const res = await fetch(`/images?page=${page}`)
const items = await res.json()
const gallery = document.getElementById("gallery")
const pageIndicator = document.getElementById("pageIndicator")
const statPosts = document.getElementById("statPosts")
gallery.innerHTML=""
if (pageIndicator) {
pageIndicator.textContent = `Page ${page}`
}

if (statPosts) {
statPosts.textContent = ((page - 1) * PAGE_SIZE) + items.length
}

if (!items.length) {
if (page > 1) {
page--
await loadImages()
return
}
gallery.innerHTML = `<div class="empty-state">No images found on this page.</div>`
return
}

items.forEach(item=>{
const card = document.createElement("button")
card.className = "grid-tile"
card.type = "button"
card.innerHTML = `
<img src="/image/${item.id}/${item.num}" alt="Verse ${item.id} - Image ${item.num}">
`
card.onclick = ()=>openModal(item.id, item.num)
gallery.appendChild(card)
})
}
function openModal(id, num){
const modal = document.getElementById("modal")
const full = document.getElementById("fullImage")
const download = document.getElementById("download")
full.src = `/image/${id}/${num}`
download.href = `/download/${id}/${num}`
download.download = `verse_${id}_${num}.png`
modal.style.display="block"
}
function closeModal(){
document.getElementById("modal").style.display="none"
}
function next(){
page++
loadImages()
}
function prev(){
if(page>1){
page--
loadImages()
}
}
document.getElementById("modal").addEventListener("click", (event)=>{
if (event.target.id === "modal") {
closeModal()
}
})
loadImages()
