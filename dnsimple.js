/*
Name:          DNSimple module for Node.js
Author:        Franklin van de Meent (https://frankl.in)
Source:        https://github.com/fvdm/nodejs-dnsimple
Feedback:      https://github.com/fvdm/nodejs-dnsimple/issues
License:       Unlicense (public domain)
               see UNLICENSE file

Service name:  DNSimple
Service URL:   https://dnsimple.com
Service API:   http://developer.dnsimple.com
*/

var https = require('https');
var app = {}

// ! - Defaults
app.api = {
  hostname: 'api.dnsimple.com',
  email: null,
  token: null,
  domainToken: null,
  twoFactorOTP: null,   // one time password (ie. Authy)
  twoFactorToken: null, // OTP exchange token
  password: null,
  timeout: 30000
}


// ! DNS

app.dns = {
  // ! dns.list
  list: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname +'/records', function( error, records, meta ) {
      if( error ) { return callback( error, null, meta )}
      records.map( function( cur, i, arr ) { arr[i] = cur.record });
      callback( null, records, meta );
    });
  },

  // ! dns.show
  show: function( domainname, recordID, callback ) {
    app.talk( 'GET', 'domains/'+ domainname +'/records/'+ recordID, function( error, record, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, record.record, meta );
    });
  },

  // ! dns.add
  // REQUIRED: name, record_type, content
  // OPTIONAL: ttl, prio
  add: function( domainname, record, callback ) {
    var post = { record: record }
    app.talk( 'POST', 'domains/'+ domainname +'/records', post, function( error, result, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, result.record, meta );
    });
  },

  // ! dns.update
  update: function( domainname, recordID, record, callback ) {
    var post = { record: record }
    app.talk( 'PUT', 'domains/'+ domainname +'/records/'+ recordID, post, function( error, result, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, result.record, meta );
    });
  },

  // ! dns.delete
  delete: function( domainname, recordID, callback ) {
    app.talk( 'DELETE', 'domains/'+ domainname +'/records/'+ recordID, function( err, data, meta ) {
      callback( err, meta.statusCode === 200, meta );
    });
  }
}


// ! DOMAINS

app.domains = {

  // ! domains.list
  // Simple returns only array with domainnames
  list: function( simple, callback ) {
    if( !callback && typeof simple === 'function' ) {
      var callback = simple;
      var simple = false;
    }

    app.talk( 'GET', 'domains', function( error, domains, meta ) {
      if( error ) { return callback( error, null, meta )}
      domains.map( function( cur, i, arr ) { arr[i] = cur.domain });
      if( simple ) {
        domains.map( function( cur, i, arr ) { arr[i] = cur.name });
      }
      callback( null, domains, meta );
    });
  },

  // ! domains.findByRegex
  findByRegex: function( regex, callback ) {
    var result = [];
    app.domains.list( false, function( error, domains, meta ) {
      if( error ) { return callback( error, null, meta )}
      var regexp = new RegExp( regex );
      for( var i = 0; i < domains.length; i++ ) {
        if( domains[i].name.match( regexp ) ) {
          result.push( domains[i] );
        }
      }
      callback( null, result, meta );
    });
  },

  // ! domains.show
  show: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname, function( error, domain, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, domain.domain, meta );
    });
  },

  // ! domains.add
  add: function( domainname, callback ) {
    var dom = { domain: { name: domainname } }
    app.talk( 'POST', 'domains', dom, function( error, domain, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, domain.domain, meta );
    });
  },

  // ! domains.delete
  delete: function( domainname, callback ) {
    app.talk( 'DELETE', 'domains/'+ domainname, function( err, data, meta ) {
      callback( err, meta.statusCode === 200, meta );
    });
  },

  // ! domains.resetToken
  resetToken: function( domainname, callback ) {
    app.talk( 'POST', 'domains/'+ domainname +'/token', function( err, data, meta ) {
      callback( err, data.domain || null, meta );
    });
  },

  // ! domains.push
  push: function( domainname, email, regId, callback ) {
    var data = { push: {
      new_user_email: email,
      contact_id: regId
    }}
    app.talk( 'POST', 'domains/'+ domainname +'/push', data, function( err, res, meta ) {
      if( err ) { return callback( err, null, meta )}
      callback( null, res.domain, meta );
    });
  },

  // ! domains.vanitynameservers
  vanitynameservers: function( domainname, enable, nameservers, callback ) {
    if( typeof nameservers === 'function' ) {
      var callback = nameservers;
      var nameservers = null;
    }

    if( enable ) {
      var input = {
        vanity_nameserver_configuration: {
          server_source: 'dnsimple'
        }
      }
      if( nameservers ) {
        input.vanity_nameserver_configuration = nameservers;
        input.vanity_nameserver_configuration.server_source = 'external';
      }
      app.talk( 'POST', 'domains/'+ domainname +'/vanity_name_servers', input, callback );
    } else {
      app.talk( 'DELETE', 'domains/'+ domainname +'/vanity_name_servers', callback );
    }
  },


  // ! DOMAINS.MEMBERSHIPS

  memberships: {
    // ! domains.memberships.list
    list: function( domainname, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/memberships', function( error, memberships, meta ) {
        if( error ) { return callback( error, null, meta )}
        memberships.map( function( cur, i, arr ) { arr[i] = cur.membership });
        callback( null, memberships, meta );
      });
    },

    // ! domains.memberships.add
    add: function( domainname, email, callback ) {
      var data = {membership: {email: email}}
      app.talk( 'POST', 'domains/'+ domainname +'/memberships', data, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = data.membership || false;
        callback( null, data, meta );
      });
    },

    // ! domains.memberships.delete
    delete: function( domainname, member, callback ) {
      app.talk( 'DELETE', 'domains/'+ domainname +'/memberships/'+ member, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = meta.statusCode === 204 ? true : false;
        callback( null, data, meta );
      });
    }
  },


  // ! DOMAINS REGISTRATION

  // ! domains.check
  // Check availability
  check: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname +'/check', {}, callback );
  },

  // ! domains.register
  // Register domainname - auto-payment!
  register: function( domainname, registrantID, extendedAttribute, callback ) {
    var vars = {
      domain: {
        name: domainname,
        registrant_id: registrantID
      }
    }

    // fix 3 & 4 params
    if( !callback && typeof extendedAttribute == 'function' ) {
      var callback = extendedAttribute;
    } else if( typeof extendedAttribute == 'object' ) {
      vars.domain.extended_attribute = extendedAttribute;
    }

    // send
    app.talk( 'POST', 'domain_registrations', vars, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = data.domain || false;
      callback( null, data, meta );
    });
  },

  // ! domains.transfer
  // Transfer domainname - auto-payment!
  transfer: function( domainname, registrantID, authinfo, callback ) {
    var vars = {
      domain: {
        name: domainname,
        registrant_id: registrantID
      }
    }

    // fix 3 & 4 params
    if( !callback && typeof authinfo == 'function' ) {
      var callback = authinfo;
    } else if( typeof authinfo == 'string' ) {
      vars.transfer_order = {
        authinfo: authinfo
      }
    }

    // send
    app.talk( 'POST', 'domain_transfers', vars, callback );
  },

  // ! domains.transferAttribute
  // Transfer domainname with Extended Attributes - auto-payment!
  transferAttribute: function( domainname, registrantID, attr, authinfo, callback ) {
    var vars = {
      domain: {
        name: domainname,
        registrant_id: registrantID
      },
      extended_attribute: attr
    }

    // fix 3 & 4 params
    if( !callback && typeof authinfo == 'function' ) {
      var callback = authinfo;
    } else if( typeof authinfo == 'string' ) {
      vars.transfer_order = {
        authinfo: authinfo
      }
    }

    // send
    app.talk( 'POST', 'domain_transfers', vars, callback );
  },

  // ! domains.renew
  // Renew domainname registration - auto-payment!
  renew: function( domainname, whoisPrivacy, callback ) {
    var vars = {
      domain: {
        name: domainname
      }
    }

    // fix 2 & 3 params
    if( !callback && typeof whoisPrivacy == 'function' ) {
      var callback = whoisPrivacy;
    } else {
      // string matching
      if( whoisPrivacy ) {
        vars.domain.renew_whois_privacy = 'true';
      } else {
        vars.domain.renew_whois_privacy = 'false';
      }
    }

    // send
    app.talk( 'POST', 'domain_renewals', vars, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = data.domain || false;
      callback( null, data, meta );
    })
  },

  // ! domains.autorenew
  // Set auto-renewal for domain
  autorenew: function( domainname, enable, callback ) {
    var method = enable ? 'POST' : 'DELETE';
    app.talk( method, 'domains/'+ domainname +'/auto_renewal', function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      callback( null, data.domain, meta );
    });
  },

  // ! domains.transferout
  // Prepare domain for transferring out
  transferout: function( domainname, callback ) {
    app.talk( 'POST', 'domains/'+ domainname +'/transfer_outs', callback );
  },

  // ! domains.whoisPrivacy
  whoisPrivacy: function( domainname, enable, callback ) {
    var method = enable ? 'POST' : 'DELETE';
    app.talk( method, 'domains/'+ domainname +'/whois_privacy', function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      callback( null, data.whois_privacy, meta );
    });
  },

  // ! domains.nameservers
  // Get or set nameservers at registry
  nameservers: function( domainname, nameservers, callback ) {
    if( typeof nameservers === 'function' ) {
      var callback = nameservers;
      var nameservers = null;
    }
    if( nameservers ) {
      var ns = {
        name_servers: nameservers
      }
      app.talk( 'POST', 'domains/'+ domainname +'/name_servers', ns, callback );
    } else {
      app.talk( 'GET', 'domains/'+ domainname +'/name_servers', callback );
    }
  },

  // ! domains.nameserver_register
  nameserver_register: function( domainname, name, ip, callback ) {
    var vars = {
      name_server: {
        name: name,
        ip: ip
      }
    }
    app.talk( 'POST', 'domains/'+ domainname +'/registry_name_servers', vars, callback );
  },

  // ! domains.nameserver_deregister
  nameserver_deregister: function( domainname, name, callback ) {
    app.talk( 'DELETE', 'domains/'+ domainname +'/registry_name_servers/'+ name, vars, callback );
  },

  // ! domains.zone
  // See http://developer.dnsimple.com/domains/zones/#zone
  zone: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname +'/zone', function(err, data, meta) {
      if (err) { return callback(err, null, meta) }
      callback(null, data.zone, meta);
    });
  },

  // ! domains.importZone
  // See http://developer.dnsimple.com/domains/zones/#import
  importZone: function( domainname, zone, callback ) {
    var zone = { zone_import: { zone_data: zone }}
    app.talk( 'POST', 'domains/'+ domainname +'/zone_imports', zone, function(err, data, meta) {
      if (err) { return callback(err, null, meta) }
      data = data.zone_import || false;
      callback(null, data, meta);
    });
  },


  // ! DOMAINS SERVICES

  // Services for domain
  services: {
    // ! domains.services.list
    // already applied
    list: function( domainname, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/applied_services', function( error, result, meta ) {
        if( error ) { return callback( error, null, meta )}
        result.map( function( cur, i, arr ) { arr[i] = cur.service });
        callback( null, result, meta );
      });
    },

    // ! domains.services.available
    // available
    available: function( domainname, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/available_services', function( error, result, meta ) {
        if( error ) { return callback( error, null, meta )}
        result.map( function( cur, i, arr ) { arr[i] = cur.service });
        callback( null, result, meta );
      });
    },

    // ! domains.services.add
    // apply one
    add: function( domainname, serviceID, settings, callback ) {
      if( typeof settings === 'function' ) {
        var callback = settings;
        var settings = null;
      }
      var service = { service: { id: serviceID } }
      if( settings ) {
        service.settings = settings;
      }
      app.talk( 'POST', 'domains/'+ domainname +'/applied_services', service, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = data[0] && data[0].service ? data[0].service : false;
        callback( null, data, meta );
      });
    },

    // ! domains.services.delete
    // delete one
    delete: function( domainname, serviceID, callback ) {
      app.talk( 'DELETE', 'domains/'+ domainname +'/applied_services/'+ serviceID, callback );
    }
  },

  // ! domains.template
  // apply template -- alias for templates.apply
  template: function( domainname, templateID, callback ) {
    app.templates.apply( domainname, templateID, callback );
  },

  // ! EMAIL FORWARDS
  email_forwards: {

    // ! domains.email_forwards.list
    list: function( domainname, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/email_forwards', function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data.map( function( cur, i, arr ) { arr[i] = cur.email_forward });
        callback( null, data, meta );
      });
    },

    // ! domains.email_forwards.add
    add: function( domainname, from, to, callback ) {
      var vars = {
        email_forward: {
          from: from,
          to: to
        }
      }
      app.talk( 'POST', 'domains/'+ domainname +'/email_forwards', vars, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        callback( null, data.email_forward, meta );
      });
    },

    // ! domains.email_forwards.show
    show: function( domainname, id, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/email_forwards/'+ id, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        callback( null, data.email_forward, meta );
      });
    },

    // ! domains.email_forwards.delete
    delete: function( domainname, id, callback ) {
      app.talk( 'DELETE', 'domains/'+ domainname +'/email_forwards/'+ id, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = meta.statusCode === 204 ? true : false;
        callback( null, data, meta );
      });
    }
  },

  // ! CERTIFICATES
  certificates: {

    // ! domains.certificates.list
    list: function( domain, callback ) {
      app.talk( 'GET', 'domains/'+ domain +'/certificates', function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data.map( function( cur, i, arr ) { arr[i] = cur.certificate });
        callback( null, data, meta );
      });
    },

    // ! domains.certificates.show
    show: function( domain, id, callback ) {
      app.talk( 'GET', 'domains/'+ domain +'/certificates/'+ id, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        callback( null, data.certificate, meta );
      });
    },

    // ! domains.certificates.add
    add: function( domain, subdomain, contactId, csr, callback ) {
      if( typeof csr === 'function' ) {
        var callback = csr;
        var csr = null;
      }
      var input = {
        certificate: {
          name: subdomain || '',
          contact_id: contactId
        }
      }
      if( csr ) {
        input.certificate.csr = csr;
      }
      app.talk( 'POST', 'domains/'+ domain +'/certificates', input, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        callback( null, data.certificate, meta );
      });
    },

    // ! domains.certificates.configure
    configure: function( domain, id, callback ) {
      app.talk( 'PUT', 'domains/'+ domain +'/certificates/'+ id +'/configure', function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        callback( null, data.certificate, meta );
      });
    },

    // ! domains.certificates.submit
    submit: function( domain, id, email, callback ) {
      var input = {
        certificate: {
          approver_email: email
        }
      }
      app.talk( 'PUT', 'domains/'+ domain +'/certificates/'+ id +'/submit', input, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        callback( null, data.certificate, meta );
      });
    }
  }
}


// ! SERVICES

app.services = {
  // ! services.list
  // List all supported services
  list: function( callback ) {
    app.talk( 'GET', 'services', function( error, list, meta ) {
      if( error ) { return callback( error, null, meta )}
      list.map( function( cur, i, arr ) { arr[i] = cur.service });
      callback( null, list, meta );
    });
  },

  // ! services.show
  // Get one service' details
  show: function( serviceID, callback ) {
    app.talk( 'GET', 'services/'+ serviceID, function( error, service, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, service.service, meta );
    });
  },

  // ! services.config
  config: function( serviceName, callback ) {
    var complete = false;
    function doCallback( err, res, meta ) {
      if( ! complete ) {
        complete = true;
        callback( err, res || null, meta );
      };
    }

    https.get( 'https://raw.githubusercontent.com/aetrion/dnsimple-services/master/services/'+ serviceName +'/config.json', function( response ) {
      var data = [];
      var size = 0;
      var error = null;

      response.on( 'data', function(ch) {
        data.push(ch);
        size += ch.length;
      })

      response.on( 'end', function() {
        data = new Buffer.concat( data, size ).toString('utf8').trim();

        try {
          data = JSON.parse( data );
        } catch(e) {
          error = new Error('not json');
        }

        if( response.statusCode >= 300 ) {
          error = new Error('API error');
          error.code = response.statusCode;
          error.headers = response.headers;
          error.body = data;
        }

        doCallback( error, data, {service: 'github'} );
      })
    })
  }
}


// ! TEMPLATES

app.templates = {
  // ! templates.list
  // List all of the custom templates in the account
  list: function( callback ) {
    app.talk( 'GET', 'templates', function( error, list, meta ) {
      if( error ) { return callback( error, null, meta )}
      list.map( function( cur, i, arr ) { arr[i] = cur.dns_template });
      callback( null, list, meta );
    });
  },

  // ! templates.show
  // Get a specific template
  show: function( templateID, callback ) {
    app.talk( 'GET', 'templates/'+ templateID, function( error, template, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, template.dns_template, meta );
    });
  },

  // ! templates.add
  // Create a custom template
  // REQUIRED: name, shortname
  // OPTIONAL: description
  add: function( template, callback ) {
    var set = { dns_template: template }
    app.talk( 'POST', 'templates', set, function( error, result, meta ) {
      if( error ) { return callback( error, null, meta )}
      callback( null, result.dns_template, meta );
    });
  },

  // ! templates.delete
  // Delete the given template
  delete: function( templateID, callback ) {
    app.talk( 'DELETE', 'templates/'+ templateID, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = meta.statusCode === 200 ? true : false;
      callback( null, data, meta );
    });
  },

  // ! templates.apply
  // Apply a template to a domain
  apply: function( domainname, templateID, callback ) {
    app.talk( 'POST', 'domains/'+ domainname +'/templates/'+ templateID +'/apply', function( error, result, meta ) {
      if( error ) { return callback( error, null, meta )}
      var result = result.domain ? result.domain : result;
      callback( null, result, meta );
    });
  },

  // records
  records: {
    // ! templates.records.list
    // list records in template
    list: function( templateID, callback ) {
      app.talk( 'GET', 'templates/'+ templateID +'/records', function( error, result, meta ) {
        if( error ) { return callback( error, null, meta )}
        result.map( function( cur, i, arr ) { arr[i] = cur.dns_template_record });
        callback( null, result, meta );
      });
    },

    // ! templates.records.show
    // Get one record for template
    show: function( templateID, recordID, callback ) {
      app.talk( 'GET', 'templates/'+ templateID +'/records/'+ recordID, function( error, result, meta ) {
        if( error ) { return callback( error, null, meta )}
        callback( null, result.dns_template_record, meta );
      });
    },

    // ! templates.records.add
    // Add record to template
    // REQUIRED: name, record_type, content
    // OPTIONAL: ttl, prio
    add: function( templateID, record, callback ) {
      var rec = { dns_template_record: record }
      app.talk( 'POST', 'templates/'+ templateID +'/records', rec, function( error, result, meta ) {
        if( error ) { return callback( error, null, meta )}
        callback( null, result.dns_template_record, meta );
      });
    },

    // ! templates.records.delete
    // Delete record from template
    delete: function( templateID, recordID, callback ) {
      app.talk( 'DELETE', 'templates/'+ templateID +'/records/'+ recordID, {}, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = meta.statusCode === 200 ? true : false;
        callback( null, data, meta );
      });
    }
  }
}


// ! CONTACTS

app.contacts = {
  // ! contacts.list
  list: function( callback ) {
    app.talk( 'GET', 'contacts', function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data.map( function( cur, i, arr ) { arr[i] = cur.contact });
      callback( null, data, meta );
    });
  },

  // ! contacts.show
  show: function( contactID, callback ) {
    app.talk( 'GET', 'contacts/'+ contactID, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      callback( null, data.contact, meta );
    });
  },

  // ! contacts.add
  // http://developer.dnsimple.com/contacts/#create-a-contact
  add: function( contact, callback ) {
    app.talk( 'POST', 'contacts', {contact: contact}, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = data.contact || false;
      callback( null, data, meta );
    });
  },

  // ! contacts.update
  // http://developer.dnsimple.com/contacts/#update-a-contact
  update: function( contactID, contact, callback ) {
    app.talk( 'PUT', 'contacts/'+ contactID, {contact: contact}, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = data.contact || false;
      callback( null, data, meta );
    });
  },

  // ! contacts.delete
  delete: function( contactID, callback ) {
    app.talk( 'DELETE', 'contacts/'+ contactID, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = meta.statusCode === 204 ? true : false;
      callback( null, data, meta );
    });
  }
}


// ! ACCOUNT

// ! .subscription
app.subscription = function( vars, callback ) {
  if( ! callback ) {
    app.talk( 'GET', 'subscription', function( err, data, meta ) {
      if( err ) { vars( err, null, meta ); return }
      vars( null, data.subscription, meta );
    })
  } else {
    var data = {subscription: vars}
    app.talk( 'PUT', 'subscription', data, function( err, res, meta ) {
      if( err ) { return callback( err, null, meta )}
      callback( null, res.subscription, meta );
    });
  }
}


// ! OTHER

// ! .prices
app.prices = function( callback ) {
  app.talk( 'GET', 'prices', function( err, data, meta ) {
    if( err ) { return callback( err, null, meta )}
    data.map( function( cur, i, arr ) { arr[i] = cur.price });
    callback( null, data, meta );
  });
}

// ! .user
app.user = function( user, callback ) {
  var user = {user: user}
  app.talk( 'POST', 'users', user, function( err, data, meta ) {
    if( err ) { return callback( err, null, meta )}
    callback( null, data.user, meta );
  });
}

// ! .extendedAttributes
app.extendedAttributes = function( tld, callback ) {
  app.talk( 'GET', 'extended_attributes/'+ tld, callback );
}


// MODULE

// ! - Communicate
app.talk = function( method, path, fields, callback ) {
  if( !callback && typeof fields === 'function' ) {
    var callback = fields;
    var fields = {}
  }

  // prevent multiple callbacks
  var complete = false;
  function doCallback( err, res, meta ) {
    if( !complete ) {
      complete = true;
      callback( err || null, res || null, meta );
    }
  }

  // credentials set?
  if( ! (app.api.email && app.api.token) && ! (app.api.email && app.api.password) && ! app.api.domainToken && ! app.api.twoFactorToken ) {
    doCallback( new Error('credentials missing') );
    return
  }

  // prepare
  var querystr = JSON.stringify(fields)
  var headers = {
    'Accept': 'application/json',
    'User-Agent': 'Nodejs-DNSimple'
  }

  // token in headers
  if( app.api.token ) {
    headers['X-DNSimple-Token'] = app.api.email +':'+ app.api.token;
  }

  if( app.api.domainToken ) {
    headers['X-DNSimple-Domain-Token'] = app.api.domainToken;
  }

  // build request
  if( method.match( /(POST|PUT|DELETE)/ ) ) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = querystr.length;
  }

  var options = {
    host: app.api.hostname,
    port: 443,
    path: '/v1/'+ path,
    method: method,
    headers: headers
  }

  // password authentication
  if( ! app.api.twoFactorToken && ! app.api.token && ! app.api.domainToken && app.api.password && app.api.email ) {
    options.auth = app.api.email +':'+ app.api.password;

    // two-factor authentication (2FA)
    if( app.api.twoFactorOTP ) {
      headers['X-DNSimple-2FA-Strict'] = 1;
      headers['X-DNSimple-OTP'] = app.api.twoFactorOTP;
    }
  }

  if( app.api.twoFactorToken ) {
    options.auth = app.api.twoFactorToken +':x-2fa-basic';
    headers['X-DNSimple-2FA-Strict'] = 1;
  }

  // start request
  var request = https.request( options );

  // response
  request.on( 'response', function( response ) {
    var meta = {statusCode: null}
    var data = [];
    var size = 0;

    response.on( 'data', function( chunk ) {
      data.push( chunk );
      size += chunk.length;
    });

    response.on( 'close', function() {
      doCallback( new Error('connection dropped') );
    });

    // request finished
    response.on( 'end', function() {
      data = new Buffer.concat( data, size ).toString('utf8').trim()
      var failed = null

      meta.statusCode = response.statusCode
      meta.request_id = response.headers['x-request-id']
      meta.runtime = response.headers['x-runtime']

      if( typeof response.headers['x-dnsimple-otp-token'] === 'string' ) {
        meta.twoFactorToken = response.headers['x-dnsimple-otp-token']
      }

      if( response.statusCode !== 204 ) {
        try {
          data = JSON.parse( data );
        } catch(e) {
          doCallback(new Error('not json'), data);
        }
      }

      // overrides
      var noError = false;

      // status ok, no data
      if( data == '' && meta.statusCode < 300 ) {
        noError = true;
      }
      // domain check 404 = free
      if( path.match(/^domains\/.+\/check$/) && meta.statusCode === 404 ) {
        noError = true;
      }

      // check HTTP status code
      if( noError || (!failed && response.statusCode < 300) ) {
        doCallback( null, data, meta );
      } else {
        if( response.statusCode == 401 && response.headers['x-dnsimple-otp'] == 'required' ) {
          var error = new Error('twoFactorOTP required');
        } else {
          var error = failed || new Error('API error');
        }
        error.code = response.statusCode;
        error.error = data.message
          || data.error
          || (data.errors && data instanceof Object && Object.keys(data.errors)[0] ? data.errors[Object.keys(data.errors)[0]] : null)
          || null;
        error.data = data;
        doCallback( error, null, meta );
      }
    });
  });

  // timeout
  request.on( 'socket', function( socket ) {
    if( app.api.timeout ) {
      socket.setTimeout( app.api.timeout );
      socket.on( 'timeout', function() {
        doCallback( new Error('request timeout') );
        request.abort();
      });
    }
  });

  // error
  request.on( 'error', function( error ) {
    if( error.code === 'ECONNRESET' ) {
      var er = new Error('request timeout');
    } else {
      var er = new Error('request failed');
    }
    er.error = error;
    doCallback( er );
  });

  // run it
  if( method.match( /(POST|PUT|DELETE)/ ) ) {
    request.end( querystr );
  } else {
    request.end();
  }
}

// wrap it up
module.exports = function( setup ) {
  for( var i in setup ) {
    app.api[ i ] = setup[ i ];
  }
  return app;
}
