let page = 1
let currentRecord = null

const PAGE_SIZE = 6
const gallery = document.getElementById("gallery")
const pageIndicator = document.getElementById("pageIndicator")
const statDays = document.getElementById("statDays")
const statImages = document.getElementById("statImages")
const statPage = document.getElementById("statPage")
const resultsSummary = document.getElementById("resultsSummary")
const prevBtn = document.getElementById("prevBtn")
const nextBtn = document.getElementById("nextBtn")
const modal = document.getElementById("modal")
const fullImage = document.getElementById("fullImage")
const modalTitle = document.getElementById("modalTitle")
const modalMeta = document.getElementById("modalMeta")
const download = document.getElementById("download")

function formatDate(dayStr) {
  if (!dayStr) return "Date unavailable"

  const [year, month, day] = dayStr.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  })
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function updatePaginationState(itemCount) {
  if (pageIndicator) {
    pageIndicator.textContent = `Page ${page}`
  }

  if (statPage) {
    statPage.textContent = String(page)
  }

  if (prevBtn) {
    prevBtn.disabled = page === 1
  }

  if (nextBtn) {
    nextBtn.disabled = itemCount < PAGE_SIZE
  }
}

function createEmptyState(title, message) {
  const empty = document.createElement("div")
  empty.className = "empty-state"
  empty.innerHTML = `<strong>${title}</strong><p>${message}</p>`
  return empty
}

function setSummary(days, images, latestDay) {
  if (!resultsSummary) return

  if (!days) {
    resultsSummary.textContent = "No images available."
    return
  }

  const latestText = latestDay ? ` Latest: ${formatDate(latestDay)}.` : ""
  resultsSummary.textContent = `${pluralize(days, "day")} | ${pluralize(images, "image")}.${latestText}`
}

function buildGroups(items) {
  const groups = {}
  const order = []

  items.forEach((item) => {
    if (!groups[item.id]) {
      groups[item.id] = {
        id: item.id,
        day: item.day,
        reference: item.reference,
        images: []
      }
      order.push(item.id)
    }

    groups[item.id].images.push(item)
  })

  order.forEach((id) => {
    groups[id].images.sort((a, b) => a.num - b.num)
  })

  return { groups, order }
}

function openModal(record) {
  currentRecord = record

  fullImage.src = `/image/${record.id}/${record.num}`
  download.href = `/download/${record.id}/${record.num}`
  download.download = `verse_${record.id}_${record.num}.png`

  const title = record.reference || `Verse day #${record.id}`
  const detailParts = [
    `Card ${record.num}`,
    formatDate(record.day)
  ]

  modalTitle.textContent = title
  modalMeta.textContent = detailParts.join(" | ")

  modal.classList.add("is-open")
  modal.setAttribute("aria-hidden", "false")
  document.body.classList.add("modal-open")
}

function closeModal() {
  modal.classList.remove("is-open")
  modal.setAttribute("aria-hidden", "true")
  fullImage.removeAttribute("src")
  currentRecord = null
  document.body.classList.remove("modal-open")
}

function createDayCard(group) {
  const card = document.createElement("article")
  card.className = "day-card"

  const heading = document.createElement("div")
  heading.className = "card-heading"

  const headingCopy = document.createElement("div")

  const label = document.createElement("p")
  label.className = "card-label"
  label.textContent = "Verse Day"

  const title = document.createElement("h3")
  title.className = "card-title"
  title.textContent = group.reference || `Verse day #${group.id}`

  const date = document.createElement("p")
  date.className = "card-date"
  date.textContent = formatDate(group.day)

  headingCopy.append(label, title, date)

  const badge = document.createElement("span")
  badge.className = "card-badge"
  badge.textContent = pluralize(group.images.length, "card")

  heading.append(headingCopy, badge)

  const pairImages = document.createElement("div")
  pairImages.className = "pair-images"

  group.images.forEach((item) => {
    const tile = document.createElement("button")
    tile.className = "grid-tile"
    tile.type = "button"
    tile.setAttribute("aria-label", `Open ${group.reference || `verse day ${group.id}`} card ${item.num}`)

    const img = document.createElement("img")
    img.src = `/image/${item.id}/${item.num}`
    img.alt = `${group.reference || `Verse day ${group.id}`} artwork ${item.num}`
    img.loading = "lazy"

    const tilePill = document.createElement("span")
    tilePill.className = "tile-pill"
    tilePill.textContent = item.num === 1 ? "Card 1" : "Card 2"

    tile.addEventListener("click", () => openModal(item))
    tile.append(img, tilePill)
    pairImages.appendChild(tile)
  })

  const footer = document.createElement("div")
  footer.className = "card-footer"

  const note = document.createElement("p")
  note.className = "card-note"
  note.textContent = "Preview, download, or delete."

  footer.append(note)
  card.append(heading, pairImages, footer)

  return card
}

async function loadImages() {
  gallery.innerHTML = ""
  gallery.appendChild(createEmptyState("Loading archive", "Fetching the latest daily verse cards..."))
  updatePaginationState(PAGE_SIZE)

  try {
    const res = await fetch(`/images?page=${page}`)

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`)
    }

    const items = await res.json()

    if (!Array.isArray(items)) {
      throw new Error("Unexpected response format")
    }

    if (!items.length) {
      if (page > 1) {
        page -= 1
        await loadImages()
        return
      }

      gallery.innerHTML = ""
      gallery.appendChild(createEmptyState("No images yet", "Generated verse cards will appear here."))

      if (statDays) statDays.textContent = "0"
      if (statImages) statImages.textContent = "0"
      updatePaginationState(0)
      setSummary(0, 0)
      return
    }

    const { groups, order } = buildGroups(items)
    gallery.innerHTML = ""

    order.forEach((id) => {
      gallery.appendChild(createDayCard(groups[id]))
    })

    if (statDays) {
      statDays.textContent = String(order.length)
    }

    if (statImages) {
      statImages.textContent = String(items.length)
    }

    updatePaginationState(items.length)
    setSummary(order.length, items.length, groups[order[0]]?.day)
  } catch (error) {
    gallery.innerHTML = ""
    gallery.appendChild(createEmptyState("Unable to load", "Please refresh and try again."))

    if (statDays) statDays.textContent = "0"
    if (statImages) statImages.textContent = "0"
    updatePaginationState(0)

    if (resultsSummary) {
      resultsSummary.textContent = "Unable to load images."
    }

    console.error(error)
  }
}

async function deleteImage() {
  if (!currentRecord) return

  const confirmed = confirm("Delete this entire record from the database? This cannot be undone.")
  if (!confirmed) return

  const res = await fetch(`/image/${currentRecord.id}`, { method: "DELETE" })

  if (res.ok) {
    closeModal()
    page = 1
    await loadImages()
    return
  }

  alert("Delete failed. Please try again.")
}

function next() {
  if (nextBtn?.disabled) return
  page += 1
  loadImages()
}

function prev() {
  if (page <= 1) return
  page -= 1
  loadImages()
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal()
    }
  })
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("is-open")) {
    closeModal()
  }
})

loadImages()
