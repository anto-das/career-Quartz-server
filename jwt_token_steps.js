/** 
* 1.after successfully login: generate a jwt token
* npm i jsonwebtoken, cookie-parser
* jwt.sign(payload,secret,{expiresIn:"1d"})
*
* 2.send token(generate in the server side) to client side
* localStorage:======> easier
*
* httpOnly cookies:=====> better
*
* 3.for sensitive or protected or private or secure apis: send token to the server side
*on the server side:
app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true
}))

set
* on the client side:
 use axios: get,post,patch,delete for secure apis and must use : {withCredentials:true}
4. validated token in the server side:
if valid: provide the data
if not valid : logout
*
*
*
*/ 