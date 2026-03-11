let page = 1
let currentId = null
const PAGE_SIZE = 6

function formatDate(dayStr) {
if (!dayStr) return ''
const [year, month, day] = dayStr.split('-').map(Number)
return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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

const groups = {}
const groupOrder = []
items.forEach(item => {
if (!groups[item.id]) {
groups[item.id] = { day: item.day, images: [] }
groupOrder.push(item.id)
}
groups[item.id].images.push(item)
})

groupOrder.forEach(id => {
const group = groups[id]
const pair = document.createElement("div")
pair.className = "day-pair"

const pairImages = document.createElement("div")
pairImages.className = "pair-images"

group.images.forEach(item => {
const card = document.createElement("button")
card.className = "grid-tile"
card.type = "button"
card.innerHTML = `<img src="/image/${item.id}/${item.num}" alt="Verse ${item.id} - Image ${item.num}">`
card.onclick = () => openModal(item.id, item.num)
pairImages.appendChild(card)
})

pair.appendChild(pairImages)

const dateBar = document.createElement("div")
dateBar.className = "date-bar"
dateBar.textContent = formatDate(group.day)
pair.appendChild(dateBar)

gallery.appendChild(pair)
})
}
function openModal(id, num){
const modal = document.getElementById("modal")
const full = document.getElementById("fullImage")
const download = document.getElementById("download")
currentId = id
full.src = `/image/${id}/${num}`
download.href = `/download/${id}/${num}`
download.download = `verse_${id}_${num}.png`
modal.style.display="block"
}
function closeModal(){
document.getElementById("modal").style.display="none"
currentId = null
}
async function deleteImage(){
if (currentId === null) return
if (!confirm("Delete this entire record from the database? This cannot be undone.")) return
const res = await fetch(`/image/${currentId}`, {method: "DELETE"})
if (res.ok) {
closeModal()
page = 1
await loadImages()
} else {
alert("Delete failed. Please try again.")
}
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
