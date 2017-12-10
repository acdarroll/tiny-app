# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (a la bit.ly).

## Final Product

!["User's URLs page"](https://github.com/acdarroll/tiny-app/docs/tiny-app/docs/urls-page.png)
!["Short URL edit page"](https://github.com/acdarroll/tiny-app/docs/short-url-page.png)
!["Short URL creation page"](https://github.com/acdarroll/tiny-app/docs/tiny-app/docs/url-create-page.png)

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
- Add a cookie key in the following format: cookie_token=\<string\> to a .env file in your root directory and
- Run the development web server using the `node express_server.js` command.