const fs = require('fs')
const puppeteer = require('puppeteer')

process.setMaxListeners(0)
const baseUrl = 'https://www.pedidosya.com.ar/restaurantes/buenos-aires?a='

const getTotalPages = async () => {
  const browser = await puppeteer.launch({ headless: true })

  const page = await browser.newPage()

  await page.goto('https://www.pedidosya.com.ar/restaurantes/buenos-aires?a=', {
    timeout: 0,
  })

  const totalPages = await page.evaluate(sel => {
    return document.querySelector('ul.pagination > li:nth-child(5) > a')
      .innerText
  })

  await browser.close()

  return Number(totalPages)
}

const getRestaurants = async (address = '', actualPage = 1) => {
  const browser = await puppeteer.launch({ headless: true })

  const page = await browser.newPage()

  await page.goto(`${baseUrl}${address}?page=${actualPage}`, {
    timeout: 0,
  })

  const restaurants = await page.evaluate(sel => {
    const results = [...document.querySelectorAll('li.restaurant-wrapper')].map(
      el => {
        const name = el.querySelector('a.arrivalName')
        const address = el.querySelector('span.address')
        const rating = el.querySelector('i.rating-points')
        const foods = el.querySelectorAll('span.categories > span')
        const shippingCost = el.querySelector('div.shipping > i')
        const delayTime = el.querySelector('div.time > i.delTime')
        const paymentMethods = el.querySelectorAll(
          'ul.content_credit_cards > li > img'
        )
        const imageLink = el.querySelector('a.arrivalLogo > img')

        return {
          name: name ? name.innerText : null,
          address: address ? address.innerText : null,
          foods: foods ? [...foods].map(food => food.innerText) : null,
          paymentMethods: paymentMethods
            ? [...paymentMethods].map(paymentMethod =>
                paymentMethod.getAttribute('title')
              )
            : null,
          rating: rating ? rating.innerText : null,
          shippingCost: shippingCost ? shippingCost.innerText : null,
          delayTime: delayTime ? delayTime.innerText : null,
          imageLink: imageLink ? imageLink.getAttribute('data-original') : null,
        }
      }
    )

    return results
  })

  await browser.close()

  return restaurants
}

const main = async () => {
  const totalPages = await getTotalPages()
  const pagination = Array.from(Array(totalPages), (_, index) => index + 1)
  let results = []

  try {
    results = await Promise.all(
      pagination.map(async page => await getRestaurants('', page))
    )
  } catch (err) {
    console.log(err)
  }

  const resultsFlatten = results.reduce((arr, val) => arr.concat(...val), [])

  fs.writeFile('resturantes.json', JSON.stringify(resultsFlatten), err => {
    if (err) throw err
    console.log('all set!')
  })
}

main()
