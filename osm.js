var logEle = document.getElementById("log");
            
            function log(msg) {
                logEle.textContent += msg + '\n';
            }

            function parse(file) {
                var cNodes = 0,
                    cWays = 0,
                    cRels = 0;

                log('parsing "' + file.name + '" ...');

                pbfParser.parse({
                    file: file,
                    endDocument: function(){
                        log('done.\n');
                        log('nodes: ' + cNodes);
                        log('ways:  ' + cWays);
                        log('rels:  ' + cRels + '\n');
                    },
                    bounds: function(bounds){
                    },
                    node: function(node){
                        cNodes++;
                    },
                    way: function(way){
                        cWays++;
                    },
                    relation: function(relation){
                        cRels++;
                    },
                    error: function(msg){
                        log('error: ' + msg);
                        throw msg;
                    }
                });
            }

            function handleFile() {
                var file = this.files[0];
                parse(file);
            }

            document.getElementById("file").addEventListener("change", handleFile, false);