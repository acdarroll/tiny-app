# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (a la bit.ly).

## Final Product

!["User's URLs page"](https://github.com/acdarroll/tiny-app/blob/master/docs/urls-page.png?raw=true)
!["Short URL edit page"](https://github.com/acdarroll/tiny-app/blob/master/docs/short-url-page.png?raw=true)
!["Short URL creation page"](https://github.com/acdarroll/tiny-app/blob/master/docs/url-create-page.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override
- dotenv

## Getting Started

- Install all dependencies (using the `npm install` command).
- Add a cookie key in the following format: cookie_token=\<string\> to a .env file in the root directory of your project
- Run the development web server using the `node express_server.js` command.