var util = require('util')

// Setup
// set env DNSIMPLE_EMAIL and DNSIMPLE_TOKEN (Travis CI)
// or use cli arguments: npm test --dnsemail=me@some.where --dnstoken=abc123
var acc = {
  hostname: process.env.npm_config_dnshostname || process.env.DNSIMPLE_HOSTNAME || 'api.sandbox.dnsimple.com',
  timeout: process.env.npm_config_dnstimeout || process.env.DNSIMPLE_TIMEOUT || null,
  email: process.env.npm_config_dnsemail || process.env.DNSIMPLE_EMAIL || null
}

var token = process.env.npm_config_dnstoken || process.env.DNSIMPLE_TOKEN || null
var pass = process.env.npm_config_dnspass || process.env.DNSIMPLE_PASS || null
var otp = process.env.npm_config_dnsotp || process.env.DNSIMPLE_OTP || null

if( pass && otp ) {
  acc.password = pass
  acc.twoFactorOTP = otp
} else if( token ) {
  acc.token = token
}

var ds = require('./')( acc )

// handle exits
var errors = 0
process.on( 'exit', function() {
  if( errors == 0 ) {
    console.log('\n\033[1mDONE, no errors.\033[0m\n')
    process.exit(0)
  } else {
    console.log('\n\033[1mFAIL, '+ errors +' error'+ (errors > 1 ? 's' : '') +' occurred!\033[0m\n')
    process.exit(1)
  }
})

// prevent errors from killing the process
process.on( 'uncaughtException', function( err ) {
  console.log()
  console.error( err.stack )
  console.trace()
  console.log()
  errors++
})

// Queue to prevent flooding
var queue = []
var next = 0

function doNext() {
  next++
  if( queue[next] ) {
    queue[next]()
  }
}

// doTest( passErr, 'methods', [
//   ['feeds', typeof feeds === 'object']
// ])
function doTest( err, label, tests ) {
  if( err instanceof Error ) {
    console.error( label +': \033[1m\033[31mERROR\033[0m\n' )
    console.error( util.inspect(err, false, 10, true) )
    console.log()
    console.error( err.stack )
    console.log()
    errors++
  } else {
    var testErrors = []
    tests.forEach( function( test ) {
      if( test[1] !== true ) {
        testErrors.push(test[0])
        errors++
      }
    })

    if( testErrors.length == 0 ) {
      console.log( label +': \033[1m\033[32mok\033[0m' )
    } else {
      console.error( label +': \033[1m\033[31mfailed\033[0m ('+ testErrors.join(', ') +')' )
    }
  }

  doNext()
}

// METHODS
queue.push( function() { doTest( null, 'methods', [
  ['dns.list', typeof ds.dns.list === 'function'],
  ['dns.show', typeof ds.dns.show === 'function'],
  ['dns.add', typeof ds.dns.add === 'function'],
  ['dns.update', typeof ds.dns.update === 'function'],
  ['dns.delete', typeof ds.dns.delete === 'function'],

  ['domains.list', typeof ds.domains.list === 'function'],
  ['domains.findByRegex', typeof ds.domains.findByRegex === 'function'],
  ['domains.show', typeof ds.domains.show === 'function'],
  ['domains.add', typeof ds.domains.add === 'function'],
  ['domains.delete', typeof ds.domains.delete === 'function'],
  ['domains.resetToken', typeof ds.domains.resetToken === 'function'],
  ['domains.push', typeof ds.domains.push === 'function'],
  ['domains.vanitynameservers', typeof ds.domains.vanitynameservers === 'function'],
  ['domains.template', typeof ds.domains.template === 'function'],

  ['domains.memberships', typeof ds.domains.memberships === 'object'],
  ['domains.memberships.list', typeof ds.domains.memberships.list === 'function'],
  ['domains.memberships.add', typeof ds.domains.memberships.add === 'function'],
  ['domains.memberships.delete', typeof ds.domains.memberships.delete === 'function'],

  ['domains.check', typeof ds.domains.check === 'function'],
  ['domains.register', typeof ds.domains.register === 'function'],
  ['domains.transfer', typeof ds.domains.transfer === 'function'],
  ['domains.renew', typeof ds.domains.renew === 'function'],
  ['domains.autorenew', typeof ds.domains.autorenew === 'function'],
  ['domains.transferout', typeof ds.domains.transferout === 'function'],
  ['domains.nameservers', typeof ds.domains.nameservers === 'function'],
  ['domains.whoisPrivacy', typeof ds.domains.whoisPrivacy === 'function'],

  ['domains.services', typeof ds.domains.services === 'object'],
  ['domains.services.list', typeof ds.domains.services.list === 'function'],
  ['domains.services.available', typeof ds.domains.services.available === 'function'],
  ['domains.services.add', typeof ds.domains.services.add === 'function'],
  ['domains.services.delete', typeof ds.domains.services.delete === 'function'],

  ['services', typeof ds.services === 'object'],
  ['services.list', typeof ds.services.list === 'function'],
  ['services.show', typeof ds.services.show === 'function'],

  ['templates', typeof ds.templates === 'object'],
  ['templates.list', typeof ds.templates.list === 'function'],
  ['templates.show', typeof ds.templates.show === 'function'],
  ['templates.add', typeof ds.templates.add === 'function'],
  ['templates.delete', typeof ds.templates.delete === 'function'],
  ['templates.apply', typeof ds.templates.apply === 'function'],

  ['templates.records', typeof ds.templates.records === 'object'],
  ['templates.records.list', typeof ds.templates.records.list === 'function'],
  ['templates.records.show', typeof ds.templates.records.show === 'function'],
  ['templates.records.add', typeof ds.templates.records.add === 'function'],
  ['templates.records.delete', typeof ds.templates.records.delete === 'function'],

  ['contacts', typeof ds.contacts === 'object'],
  ['contacts.list', typeof ds.contacts.list === 'function'],
  ['contacts.show', typeof ds.contacts.show === 'function'],
  ['contacts.add', typeof ds.contacts.add === 'function'],
  ['contacts.update', typeof ds.contacts.update === 'function'],
  ['contacts.delete', typeof ds.contacts.delete === 'function'],

  ['subscription', typeof ds.subscription === 'function'],
  ['prices', typeof ds.prices === 'function'],
  ['talk', typeof ds.talk === 'function']
])})

// First check API access
queue.push( function() {
  ds.talk('GET', 'prices', function(err, data) {
    if(err) {
      console.log('API access: failed ('+ err.message +')')
      console.log(err.stack)
      errors++
      process.exit(1)
    } else {
      console.log('API access: \033[1m\033[32mok\033[0m')
      doNext()
    }
  })
})

// Real world tests
function testArrObj( src ) {
  return [
    ['data type', src && src instanceof Array],
    ['item type', src && src[0] && src[0] instanceof Object]
  ]
}

function testObj( src ) {
  return [
    ['data type', src && typeof src === 'object']
  ]
}

// bogus material to use
var bogus = {
  domain: {
    name: 'test-'+ Date.now() +'-delete.me'
  },
  dns: [
    { name: 'testing',
      record_type: 'A',
      content: '127.0.0.1',
      ttl: 86400
    },
    { name: 'testing',
      record_type: 'MX',
      content: 'localhost',
      prio: 10
    }
  ],
  contact: {
    first_name: 'John',
    last_name: 'Smith',
    address1: '1000 SW 1st Street',
    city: 'Miami',
    state_province: 'FL',
    postal_code: '33143',
    country: 'US',
    email_address: 'john.smith@example.com',
    phone: '505 111 2222',
    organization_name: 'Little Co Inc.',
    job_title: 'President',
    label: 'Office'
  },
  template: {
    name: 'Test dnsimple.js',
    short_name: 'test',
    description: 'Add fake DNS records.'
  }
}

queue.push( function() {
  ds.prices( function( err, data ) { doTest( err, 'prices', testArrObj(data) )})
})

// ! account
queue.push( function() {
  ds.subscription( function( err, data ) { doTest( err, 'subscription', testObj(data) )})
})

// ! domains.add
queue.push( function() {
  ds.domains.add( bogus.domain.name, function( err, data ) {
    bogus.domain = data
    doTest( err, 'domains.add', testObj(data) )
  })
})

// ! domains.show
queue.push( function() {
  ds.domains.show( bogus.domain.name, function( err, data ) {
    doTest( err, 'domains.show', [
      ['type', data instanceof Object],
      ['value', data.name === bogus.domain.name]
    ])
  })
})

// ! domains.resetToken
queue.push( function() {
  ds.domains.resetToken( bogus.domain.name, function( err, data ) {
    doTest( err, 'domains.resetToken', [
      ['type', data instanceof Object],
      ['property', typeof data.token === 'string'],
      ['token', data.token != bogus.domain.name.token]
    ])
  })
})

// ! domains.list full
queue.push( function() {
  ds.domains.list( function( err, data ) {
    doTest( err, 'domains.list full', testArrObj(data) )
  })
})

// ! domains.list simple
queue.push( function() {
  ds.domains.list( true, function( err, data ) { doTest( err, 'domains.list simple', [
    ['data type', data instanceof Array]
  ])})
})

// ! domains.findByRegex
queue.push( function() {
  ds.domains.findByRegex( /\.me$/, function( err, data ) {
    doTest( err, 'domains.findByRegex', testArrObj(data) )
  })
})

// ! dns.add
queue.push( function() {
  ds.dns.add( bogus.domain.name, bogus.dns[0], function( err, data ) {
    bogus.dns[0].id = data.id
    doTest( err, 'dns.add', testObj(data))
  })
})

// ! dns.show
queue.push( function() {
  ds.dns.show( bogus.domain.name, bogus.dns[0].id, function( err, data ) {
    doTest( err, 'dns.show', [
      ['type', data instanceof Object],
      ['property', data.id === bogus.dns[0].id]
    ])
  })
})

// ! dns.update
queue.push( function() {
  ds.dns.update( bogus.domain.name, bogus.dns[0].id, {ttl:1000}, function( err, data, meta ) {
    doTest( err, 'dns.update', [
      ['result', meta.statusCode === 200]
    ])
  })
})

// ! domains.zone - get
queue.push( function() {
  ds.domains.zone( bogus.domain.name, function( err, data, meta ) {
    bogus.domain_zone = data
    doTest( err, 'domains.zone get', [
      ['data type', typeof data === 'string'],
      ['data match', !!~data.indexOf('\$ORIGIN '+ bogus.domain.name +'\.')]
    ])
  })
})

// ! domains.zone - import
queue.push( function() {
  ds.domains.zone( bogus.domain.name, bogus.domain_zone, function( err, data, meta ) {
    doTest( err, 'domains.zone import', [
      ['result', meta.statusCode === 201],
      ['data type', data instanceof Object],
      ['record', data.imported_records && data.imported_records[0].ttl === 1000]
    ])
  })
})

// ! dns.list
queue.push( function() {
  ds.dns.list( bogus.domain.name, function( err, data ) {
    doTest( err, 'dns.list', testArrObj(data))
  })
})

// ! dns.delete
queue.push( function() {
  ds.dns.delete( bogus.domain.name, bogus.dns[0].id, function( err, data, meta ) {
    doTest( err, 'dns.delete', [
      ['data type', typeof data === 'boolean'],
      ['data value', data === true]
    ])
  })
})

// ! domains.memberships.add
queue.push( function() {
  ds.domains.memberships.add( bogus.domain.name, 'nodejs.test.account@frankl.in', function( err, data, meta ) {
    bogus.domain_membership = data
    doTest( err, 'domains.memberships.add', [
      ['result', meta.statusCode === 201],
      ['data type', data instanceof Object],
      ['value', data.domain_id === bogus.domain.id]
    ])
  })
})

// ! domains.memberships.list
queue.push( function() {
  ds.domains.memberships.list( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.memberships.list', [
      ['data type', meta.statusCode === 200 && data instanceof Array]
    ])
  })
})

// ! domains.memberships.delete
queue.push( function() {
  ds.domains.memberships.delete( bogus.domain.name, bogus.domain_membership.id, function( err, data, meta ) {
    doTest( err, 'domains.memberships.delete', [
      ['result', data === true]
    ])
  })
})

// ! domains.services.available
queue.push( function() {
  ds.domains.services.available( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.services.available', testArrObj(data))
  })
})

// ! domains.services.add
queue.push( function() {
  ds.domains.services.add( bogus.domain.name, 31, {url:'http://npmjs.org/'}, function( err, data, meta ) {
    doTest( err, 'domains.services.add', [
      ['result', meta.statusCode === 200],
      ['type', data instanceof Object],
      ['value', data.short_name === 'urlforward']
    ])
  })
})

// ! domains.services.list
queue.push( function() {
  ds.domains.services.list( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.services.list', testArrObj(data))
  })
})

// ! domains.delete
queue.push( function() {
  ds.domains.delete( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.delete', [
      ['data type', typeof data === 'boolean'],
      ['data value', data === true]
    ])
  })
})


// Start the tests
queue[0]()
