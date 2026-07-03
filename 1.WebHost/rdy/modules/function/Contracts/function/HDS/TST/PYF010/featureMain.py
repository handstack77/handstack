import json

class PYF010:
    def GF01(parameters, dataContext):
        print(parameters["GlobalID"])
        print(dataContext)
        
        dataDict = json.loads(dataContext)

        result = {
            "DataTable1": [
                {
                    "accessToken": dataDict["accessToken"],
                    "globalID": dataDict["globalID"],
                    "environment": dataDict["environment"],
                    "platform": dataDict["platform"]
                }
            ]
        }

        return json.dumps(result, ensure_ascii=False, indent=4)
