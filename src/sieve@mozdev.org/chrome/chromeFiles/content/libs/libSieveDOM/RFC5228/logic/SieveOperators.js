/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";
 
/*
 * Currenlty we have only Unary Operators like not and Nary/Multary like anyof allof
 * Sieve does not implement binary (2) or tenary operators (3)
 */
 
// Unary operators
SieveNotOperator.isElement
  = function(parser)
{ 
  return parser.startsWith("not");
}

function SieveNotOperator(docshell,id) 
{
  // first line with deadcode
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = []
  this.whiteSpace[0] = this._createByName("whitespace", " ");
  this.whiteSpace[1] = this._createByName("whitespace");
 // this.test = this._createByName("operator");
}

SieveNotOperator.prototype.__proto__ = SieveAbstractElement.prototype;

SieveNotOperator.prototype.init
    = function (parser)
{
  // Syntax :
  // <"not"> <test>  
  parser.extract("not");
  
  this.whiteSpace[0].init(parser);  
  
  if ( ! this._probeByClass(["test","operator"],parser)) 
    throw "Test command expected but found:\n'"+parser.bytes().substr(0,50)+"'...";                 

  this._test = this._createByClass(["test","operator"],parser)
    
  if (this._probeByName("whitespace",parser))
    this.whiteSpace[1].init(parser);  
  
  return this;
    
}

SieveNotOperator.prototype.removeChild
    = function (childId,cascade,stop)
{
  if (!cascade)
    throw "only cascade possible";
    
  if (this.test().id() != childId)
    throw "Invalid Child id";

  // We cannot survive without a test ...
  this.test().parent(null);  
  this._test = null;
  
  if (stop && (stop.id() == this.id()))
    return this.remove(cascade,stop);
  
  return this
}

SieveNotOperator.prototype.test
    = function (item)
{
  if (typeof(item) === "undefined")
   return this._test;
  
   if (item.parent())
     throw "test already bound to "+item.parent().id();
     
  // Release old test...
  if (this._test)
    this._test.parent(null);
    
  // ... and bind new test to this node
  this._test = item.parent(this);
  
  return this;
}

SieveNotOperator.prototype.toScript
    = function ()
{
  return "not"
    + this.whiteSpace[0].toScript()
    + this._test.toScript()
    + this.whiteSpace[1].toScript();
}

SieveNotOperator.prototype.toWidget
    = function()
{
  return (new SieveNotUI(this));
}

//****************************************************************************//

//N-Ary Operator
//****************************************************************************/
function SieveAnyOfAllOfTest(docshell,id)
{
  SieveTestList.call(this,docshell,id);  
  this.whiteSpace = this._createByName("whitespace");  
  this.isAllOf = true;
}

// Inherrit TestList
SieveAnyOfAllOfTest.prototype.__proto__ = SieveTestList.prototype;

SieveAnyOfAllOfTest.isElement
   = function (parser)
{
  if (parser.startsWith("allof"))
    return true;
    
  if (parser.startsWith("anyof"))
    return true;
    
  return false;
}

SieveAnyOfAllOfTest.prototype.init
    = function (parser)
{   
  if (parser.startsWith("allof"))
    this.isAllOf = true;
  else if (parser.startsWith("anyof"))
    this.isAllOf = false;
  else
    throw "allof or anyof expected but found: \n"+parser.bytes().substr(0,50)+"...";
    
  // remove the allof or anyof
  parser.extract(5);
  
  this.whiteSpace.init(parser);
  
  SieveTestList.prototype.init.call(this,parser);  
  
  return this;
}

SieveAnyOfAllOfTest.prototype.test
    = function (item, old)
{
  if (typeof(item) === "undefined")
  {
    if (this.tests.length == 1)
     return this.tests[0][1];
    
    throw ".test() has more than one element";
  }
  
  if (item.parent())
     throw "test already bound to "+item.parent().id();
     
   
  // Release old test...
  this.append(item,old);
  
  if (typeof(old) !== "undefined") 
    this.removeChild(old.id());
  /*if (this._test)
    this._test.parent(null);
    
  // ... and bind new test to this node
  this._test = ;*/
  
  return this;
}

SieveAnyOfAllOfTest.prototype.toScript
    = function()
{
  return (this.isAllOf?"allof":"anyof")
           + this.whiteSpace.toScript()
           + SieveTestList.prototype.toScript.call(this);  
}

SieveAnyOfAllOfTest.prototype.toWidget
    = function ()
{
  return (new SieveAnyOfAllOfUI(this));
}



if (!SieveLexer)
  throw "Could not register Conditional Elements";


SieveLexer.register("operator","operator/not",SieveNotOperator);
SieveLexer.register("operator","operator/anyof",SieveAnyOfAllOfTest);
            
