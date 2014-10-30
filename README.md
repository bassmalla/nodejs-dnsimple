nodejs-dnsimple
===============

This is an unofficial DNSimple API module for node.js.
You need a DNSimple account to use this.

[Documentation](https://github.com/fvdm/nodejs-dnsimple/blob/master/README.md) -
[Changelog](https://github.com/fvdm/nodejs-dnsimple/blob/master/CHANGELOG.md)

[node.js](http://nodejs.org/) -
[DNSimple](https://dnsimple.com/) -
[API documentation](http://developer.dnsimple.com/)


Installation
------------

[![Build Status](https://travis-ci.org/fvdm/nodejs-dnsimple.svg?branch=Tests)](https://travis-ci.org/fvdm/nodejs-dnsimple)

The release on npm is the latest stable version:

	npm install dnsimple

The code on Github is the most recent version, but can be unstable:

	npm install git+https://github.com/fvdm/nodejs-dnsimple


Usage
-----

First you need to load and setup the module with `new require('dnsimple')( setupObject )`.
See _Configuration_ below for details on _setupObject_.

```js
var dnsimple = new require('dnsimple')({ email: 'you@web.tld', token: 'abc123' })

dnsimple.domains.add( 'example.tld', function( err, domain ) {
	console.log( domain.name +' created with ID '+ domain.id )
})
```


Authentication
--------------

The module supports authentication by **email + token**, **email + password**, **domain token** and **2FA/Authy** (two-factor authentication).
The *token* is more secure as it can easily be reset in your account at [dnsimple.com/account](https://dnsimple.com/account).
The *password* uses HTTP Basic Authentication.
Use *domain token* to connect to only one specific domainname.


### Account token

```js
require('dnsimple')({ email: 'your@email.tld', token: '12345abcde' })
```


### Password

```js
require('dnsimple')({ email: 'your@email.tld', password: 'secret' })
```

### Two-factor authentication (2FA / OTP)

When you have set up two-factor authentication for your account the module returns error `twoFactorOTP missing` when you did not provide your one-time password.

First your need to tell the API _once_ your one-time code from Authy or SMS, by defining it during setup along with your email and password and calling a random method. Then the API returns a token which you can use instead of your email and password.

```js
// Set the OTP code on load
var dnsimple = require('dnsimple')({
  email: 'my@mail.tld',
  password: 'my-secret',
  twoFactorOTP: '0123456'
})

// Now call a random method to trade the OTP for a longterm token
dnsimple.subscription( function( err, data, meta ) {
  if( err ) { console.log(err); return }
  console.log( 'Two-factor token: '+ meta.twoFactorToken )
})

// From now one only use this token - no email/password
var dnsimple = require('dnsimple')({
  twoFactorToken: '22596363b3de40b06f981fb85d82312e'
})
```


### Domain token

For access to only one domainname, login with your `domainToken`.

```js
require('dnsimple')({ domainToken: 'abc123' })
```


Configuration
-------------

When loading the module into your code you need to provide a _setupObject_ for authentication as described above.
This object can have a few more settings.

	name          description                             default value
	-----------   -------------------------------------   ----------------
	email         Account email address.
	token         Account access token.
	password      Account password.
	domainToken   Domain specific API access token.
	timeout       End API call after this amount of ms.   5000
	hostname      API endpoint.                           api.dnsimple.com


Methods
-------

Each method takes a _callback_ function with three parameters: `err`, `data` and `meta`.

When an error occurs `err` is an instance of `Error` and `data` is `null`. It can get a `.code` property if a HTTP error happened and a `.data` property
if the remote API returned something other than JSON data. It also has a `.stack` property to figure out where the error was triggered.

When everything looks alright `err` will be _null_ and `data` will be the parsed JSON _object_ or _array_.

The `meta` parameter is always available and contains extra information from the API, such as statusCode, request_id, runtime and twoFactorToken.


### Errors

	credentials missing   No authentication details set
	connection dropped    Connection was closed too early
	domain exists         You or another DNSimple user has this domain
	not json              Invalid API response, see err.code and err.data
	HTTP error            The API returned an error, see err.code and err.data
	request timeout       The request took too long
	request failed        The request failed, see err.error
	

Domains
-------

### DomainObject

When below `DomainObject` is mentioned, it looks like the one below.
It is passed through directly from the API.

```js
{ id: 1111,
  user_id: 432,
  registrant_id: null,
  name: 'example.net',
  unicode_name: 'example.net',
  token: 'uwakVhw4AB4ibbn4_gv',
  state: 'hosted',
  language: null,
  lockable: true,
  auto_renew: false,
  whois_protected: false,
  record_count: 13,
  service_count: 0,
  expires_on: null,
  created_at: '2012-08-04T14:31:10.058Z',
  updated_at: '2013-12-23T15:24:50.250Z',
  parsed_expiration_date: null,
  expires_at: null,
  name_server_status: null,
  'private_whois?': false }
```


### domains.list ( [simpleBool], callback )

List domainnames in your account.


**simpleBool** true

A simple *array* with domainnames.

```js
dnsimple.domains.list( true, console.log )

[ 'one.com',
  'two.net',
  'three.nl' ]
```


**simpleBool** false (default)

An array with your domainnames.

```js
[ DomainObject,
  DomainObject ]
```


### domains.findByRegex ( regexString, cb )

List only domains with names matching on regex.

```js
// All .com domains
dnsimple.domains.findByRegex( '\.com$', console.log )
```

Same output format as `domains.list`.


### domains.show ( domainname, cb )

Get details about one domainname.
Either use the domainname or its ID.

```js
dnsimple.domains.show( 'one.com', console.log )
```

Output: `DomainObject`


### domains.add ( domainname, cb )

Add a domain to your account

```js
dnsimple.domains.add( 'mydomain.net', console.log )
```

Success

`DomainObject`

Error

```js
{ [Error: HTTP error]
  code: 400,
  data: { errors: { name: [ 'has already been taken' ] } } }
```

```js
{ [Error: HTTP error]
  code: 400,
  data: { errors: { name: [ 'is an invalid domain' ] } } }
```


### domains.delete ( domainname, cb )

Delete a domains and its DNS records from your account.
Either use the domainname or its ID.

```js
dnsimple.domains.delete( 'two.com', console.log )
```


### domains.resetToken ( domainname, cb )

Reset the domain specific API-token.
Either use the domainname or its ID.

```js
dnsimple.domains.resetToken( 'two.com', console.log )
```


### domains.push ( domainname, email, contactId, cb )

Give the domain to another DNSimple user.
Either use the domainname or its ID.

```js
dnsimple.domains.push( 'two.com', 'other@user.tld', '123', console.log )
```


### domains.vanitynameservers ( domainname, enable, cb )

Toggle vanity nameservers on (`true`) or off (`false`) for a domain.

```js
dnsimple.domains.vanitynameservers( 'two.com', true, console.log )
```


Memberships
-----------

### domains.memberships.list ( domainname, cb )

List memberships for a domain.

```js
dnsimple.domains.memberships.list( 'two.com', console.log )
```


### domains.memberships.add ( domainname, email, cb )

Add a member to a domain.

If the person already exists in DNSimple as a customer then he will immediately be added to the domain’s membership list.
If the person does not yet have a DNSimple account then he will receive an invitation to join via email.

```js
dnsimple.domains.memberships.add( 'two.com', 'other@user.tld', console.log )
```


### domains.memberships.delete ( domainname, member, cb )

Remove a member from a domain.

```js
dnsimple.domains.memberships.delete( 'two.com', 'other@user.tld', console.log )
```


Registration
------------

### domains.check ( domainname, cb )

Check domainname availability for registration or transfer to DNSimple.

```js
dnsimple.domains.check( 'frankl.in', console.log )
```

**Unavailable:**

```js
{ name: 'frankl.in',
  status: 'unavailable',
  price: '25.00',
  currency: 'USD',
  currency_symbol: '$',
  minimum_number_of_years: 1 }
```


**Available:**

```js
{ name: 'awesome-stuff.org',
  status: 'available',
  price: '14.00',
  currency: 'USD',
  currency_symbol: '$',
  minimum_number_of_years: 1 }
```


### domains.register ( domainname, registrantID, [extendedAttribute], cb )

Register a domainname at DNSimple. Your account will be charged on successful registration.

* **domainname** - *required* - the domain to register
* **registrantID** - *required* - the owner of the domain
* **extendedAttribute** - *optional* - extra fields for certain TLDs

```js
dnsimple.domains.register( 'example.tld', 1, console.log )
```


### domains.transfer ( domainname, registrantID, [authinfo], cb )

* **domainname** - *required* - the domain to transfer into your account
* **registrantID** - *required* - the new owner of the domain
* **authinfo** - *optional* - the auth-code required for some TLDs

```js
dnsimple.domains.transfer( 'example.tld', 1, 'abcdefg', console.log )
```


### domains.renew ( domainname, [whoisPrivacy], cb )

Renew a domainname registration for a new period.

* **domainname** - *required* - the domain to renew
* **whoisPrivacy** - *optional* - also renew whois privacy protection, true or false

```js
dnsimple.domains.renew( 'example.tld', true, console.log )
```


### domains.autorenew ( domainname, status, cb )

Enable or disable auto-renewal for a domainname.

* **domainname** - *required* - the domain to set the autorenew for
* **status** - *required* - enabled or disable autorenewal

```js
dnsimple.domains.autorenew( 'example.tld', true, console.log )
```


### domains.transferout ( domainname, cb )

Prepare a domain for transferring to another registrar.

```js
domains.transferout( 'example.tld', console.log )
```


### domains.nameservers ( domainname, nameservers, cb )

Set nameservers for a domain at the registry.

* **domainname** - *required* - the domain to set nameservers for
* **nameservers** - *required* - object with nameservers to set

```js
dnsimple.domains.nameservers(
	'example.tld',
	{
		ns1:	'ns1.company.tld',
		ns2:	'ns2.company.tld'
	},
	console.log
)
```


### domains.whoisPrivacy ( domainname, enable, cb )

Toggle whois privacy protection on a domain on (`true`) or off (`false`).

```js
dnsimple.domains.whoisPrivacy( 'two.com', true, console.log )
```


Services
--------

### domains.services.list ( domainname, cb )

List applied services (vendor presets) for a domain

```js
dnsimple.domains.services.list( 'one.com', console.log )
```


### domains.services.available ( domainname, cb )

List available services for a domain

```js
dnsimple.domains.services.available( 'one.com', console.log )
```


### domains.services.add ( domainname, serviceID, cb )

Apply a service to a domain

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Apply Heroku presets to one.com
dnsimple.domains.services.add( 'one.com', 'heroku', console.log )
```


### domains.services.delete ( domainname, serviceID, cb )

Remove a service from a domain

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Remove Heroku presets from one.com
dnsimple.domains.services.delete( 'one.com', 'heroku', console.log )
```


### domains.template ( domainname, templateID, cb )

Apply a template (custom presets) to a domain. This is an alias for *templates.apply*.

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Apply your office records to one.com
dnsimple.domains.template( 'one.com', 'office', console.log )
```


DNS
---

### dns.list ( domainname, cb )

List DNS records for a domain

```js
dnsimple.dns.list( 'one.com', console.log )
```


### dns.show ( domainname, recordID cb )

Get DNS record details for a *recordID* on *domainname*

```js
dnsimple.dns.show( 'one.com', 1234, console.log )
```

Returns an object with the record details:

```js
{ content: '4.3.2.1',
  created_at: '2011-03-31T01:21:08Z',
  domain_id: 123,
  domain_service_id: null,
  id: 1234,
  name: '',
  pdns_identifier: '112233',
  prio: null,
  record_type: 'A',
  special_type: null,
  ttl: 3600,
  updated_at: '2011-11-28T20:39:51Z' }
```


### dns.add ( domainname, recordObject, cb )

**Required:** name, record_type, content

**Optional:** ttl, prio

```js
dnsimple.dns.add(
	'one.com',
	{
		name:			'www',
		record_type:	'A',
		content:		'4.3.2.1'
	},
	console.log()
)
```


### dns.update ( domainname, recordID, cb )

Replace a record's details, same syntax as **dns.add**.


### dns.delete ( domainname, recordID, cb )

Delete a DNS record from a domain.

```js
dnsimple.dns.delete( 'one.com', 1234 )
```


Other methods
-------------

### subscription ( [createObject], cb )

Get or create subscription details for your account.


**Get details:**

```js
dnsimple.subscription( console.log )
```


**Create subscription:**

```js
dnsimple.subscription(
	{
		plan: 'Silver',
		credit_card: {
			number: '1',
			first_name: 'John',
			last_name: 'Smith',
			billing_address: '111 SW 1st Street',
			billing_zip: '12345',
			month: '02',
			year: '2015',
			cvv: '111'
		}
	},
	console.log
)
```


### statements ( cb )

Get account history statements.

Note: the *_view properties are very large.

```js
[ { id: 123,
    subscription_id: 111,
    statement_identifier: '987',
    text_view: '...',
    basic_html_view: '...',
    html_view: '...',
    settled_at: null,
    opened_at: '2014-02-06T05:42:55Z',
    closed_at: null,
    created_at: '2014-02-08T08:02:57Z',
    updated_at: '2014-02-12T08:03:45Z' } ]
```


### prices ( cb )

List all prices.

```js
dnsimple.prices( console.log )
```

```js
[ { tld: 'com',
    minimum_registration: 1,
    registration_price: '14.00',
    registration_enabled: true,
    transfer_price: '14.00',
    transfer_enabled: true,
    renewal_price: '14.00',
    renewal_enabled: true } ]
```


### user ( object, cb )

Create a user account at DNSimple.com

```js
var details = {
  email: 'john.smith@example.net',
  password: 'abc123',
  password_confirmation: 'abc123'
}
dnsimple.user( details, console.log )
```

```js
{ id: 104,
  email: 'john.smith@example.net',
  referral_token: 'd1a416add1d12a',
  single_access_token: '2aLdAc71vg1aIM1wLaTh',
  domain_count: 0,
  domain_limit: 10,
  login_count: 0,
  failed_login_count: 0,
  created_at: '2014-10-30T18:55:40.819Z',
  updated_at: '2014-10-30T18:55:40.848Z',
  first_name: null,
  last_name: null,
  default_contact_id: null }
```

Unlicense
---------

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
