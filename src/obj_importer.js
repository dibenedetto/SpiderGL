var objImporter = function () {
  
}
objImporter.prototype = {
  streamData: function(stream) {
    var completed = stream.completed();
    var lines = (this.unprocessedStream + stream.getData() ).split('/n');
    if (!completed)
      this.unprocessedStream = lines.pop();
    for (var i = 0; i < lines.lenght; i++)
      processLine(lines[i]);
    if (completed)
      this.EOF();
  }
  ,
  processLine: function(line) {
    var tokens =
      line
      .replace(/\s+/g," ")
      .trim()
      .split(" ");
    var parseVertex = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      this.currentGroup.positions.push(x,y,z);
    }
    var parseTxtCoords = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      if (isNan z) z = 0.0;
      this.currentGroup.txtcoords.push(x,y,z);
      this.currentGroup.usesTxtCoords = true;
    }
    var parseNormals = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      this.currentGroup.positions.push(x,y,z);
      this.currentGroup.usesNormals = true;
    }
    var parseFace = function(v1,v2,v3) {
       /* ....... */
      if (arguments.length > 3)
      {
        // from [0,1,2,3,...] to [0,2,3,...]
        arguments[0] = array.prototype.shift.call(arguments);       
        parseFace.apply(this,arguments);
      }
    }
    switch(tokens.shift()) {
      case "v":
    }
  }
