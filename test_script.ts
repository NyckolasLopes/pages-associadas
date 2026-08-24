console.log(await supabase.from("produtos").select("id, nome, internal_tags").not("internal_tags", "is", null).limit(2))
