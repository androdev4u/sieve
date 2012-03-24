/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";
 
// Sieve Lexer is a static class...

var SieveLexer = 
{
  types :  {},
  names : {},//[],
  maxId : 0,
  
  register: function (type,name,callback)
  {
    if (!callback.isElement)
      throw "Lexer Error: isElement function for "+name+" missing";
      
    if (this.types[type] == null)
      this.types[type] = new Object();
          
    var obj = new Object();
    obj.name = name;
    obj.onProbe =  function(token) {return callback.isElement(token)} 
    obj.onNew = function(docshell, id) {return new callback(docshell,id)};
    
    this.names[name] = obj;
    this.types[type][name] = obj;      
  },
  
  getConstructor : function(selectors, token)
  {
    if (!selectors.length)
      throw "Invalid Type list, not an array";
      
    // enumerate all selectors...
    for (var selector in selectors)
    {
      selector = selectors[selector];
    
      for (var key in this.types[selector])
        if (this.types[selector][key].onProbe(token))
          return this.types[selector][key].onNew;
    }
             
    return null;    
  },
  
  /**
   * by class...
   * Parses the given Data and returns the result
   * 
   * @param {SieveDocument} docshell
   * @param {String} type
   * @param {String} data
   * @return {}
   **/
  createByClass : function(docshell, types, parser)
  {
    var item = this.getConstructor(types,parser);

    if (item == null)
      throw "No compatible Constructor for Class(es): "+types+" in "+parser.bytes();
    
    var item = item(docshell, ++(this.maxId));
    
    if (typeof(parser) != "undefined")
      item.init(parser);
      
    return item;     
  },
  
  /**
   * Creates an element for a by name and returns the result
   *
   * @param {SieveDocument} docshell
   * @param {String} name
   * @optional @param {String} initializer
   *   A sieve token as string, used to initialize the created element.
   *    
   * @return {}
   **/
  createByName : function(docshell, name, parser)
  {   
    if (!this.names[name])
      throw "No Constructor for >>"+name+"<< found";
      
    try
    {
      var item = this.names[name].onNew(docshell, ++(this.maxId));
      
      if (parser)
        item.init(parser);
        
      return item; 
    }
    catch (e)
    {
      throw(" "+e+" \r\n"+name+"\r\n"+this.names)
    }
  },
  
  getMaxId : function ()
  {
    return this.maxId();
  },
  
  probeByName : function(name,parser)
  {
    // If there's no data then skip
    if ((typeof(parser) === "undefined") || parser.empty())
      return false;
      
    if (this.names[name].onProbe(parser))
      return true;
      
    return false;
  },
  
  /**
   * Tests if the given Data is parsable
   * @param {} type
   * @param {} data
   * @return {Boolean}
   */
  probeByClass : function(types,parser)
  {
    // If there's no data then skip
    if ((typeof(parser) === "undefined") || parser.empty())
      return false;
      
    // Check for an valid element constructor... 
    if (this.getConstructor(types,parser))
      return true;
      
    return false;      
  }
}
