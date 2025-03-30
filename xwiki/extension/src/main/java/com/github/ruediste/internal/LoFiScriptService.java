package com.github.ruediste.internal;

import java.util.Collection;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;

import org.xwiki.component.annotation.Component;
import org.xwiki.script.service.ScriptService;
import org.xwiki.wiki.descriptor.WikiDescriptorManager;
import org.xwiki.wiki.manager.WikiManagerException;

@Component
@Named("lofi")
@Singleton
public class LoFiScriptService implements ScriptService {
    @Inject
    private WikiDescriptorManager wikiDescriptorManager;

    public String getWikiId() {
        return wikiDescriptorManager.getCurrentWikiId();
    }

    public Collection<String> getAllWikiIds() throws WikiManagerException {
        return wikiDescriptorManager.getAllIds();
    }
}
